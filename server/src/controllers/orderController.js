const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Counter = require("../models/Counter");

// Generate a readable, unique bill reference.
// The database unique index provides the final uniqueness guarantee.

const generateBillNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "billNumber" },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `DSS-${String(counter.sequence).padStart(3, "0")}`;
};

// POST /api/orders
// Generate and save a bill
const createOrder = async (req, res) => {
  try {
    const {
      items,
      orderType = "TAKEAWAY",
      paymentMethod,
    } = req.body;

    const allowedOrderTypes = [
      "DINE_IN",
      "TAKEAWAY",
      "SWIGGY",
      "ZOMATO",
    ];

    if (!allowedOrderTypes.includes(orderType)) {
      return res.status(400).json({
        message: "Invalid order type.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Please select at least one menu item.",
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        message: "A bill cannot contain more than 100 item entries.",
      });
    }

    // Platform orders are recorded as platform-paid.
    // Cash is the default for ordinary shop orders.
    const expectedPaymentMethod =
      orderType === "SWIGGY" || orderType === "ZOMATO"
        ? "PLATFORM"
        : null;

    const finalPaymentMethod =
      paymentMethod || expectedPaymentMethod || "CASH";

    const allowedPaymentMethods = ["CASH", "UPI", "PLATFORM"];

    if (!allowedPaymentMethods.includes(finalPaymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method.",
      });
    }

    if (
      expectedPaymentMethod &&
      finalPaymentMethod !== expectedPaymentMethod
    ) {
      return res.status(400).json({
        message: "Swiggy and Zomato orders must use PLATFORM payment.",
      });
    }

    if (!expectedPaymentMethod && finalPaymentMethod === "PLATFORM") {
      return res.status(400).json({
        message: "PLATFORM payment is only valid for Swiggy or Zomato orders.",
      });
    }

    // Validate IDs and quantities before querying MongoDB.
    const quantities = new Map();

    for (const item of items) {
      if (
        !item.menuItem ||
        !/^[a-f\d]{24}$/i.test(String(item.menuItem))
      ) {
        return res.status(400).json({
          message: "A valid menu item ID is required.",
        });
      }

      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 1000
      ) {
        return res.status(400).json({
          message: "Quantity must be a whole number between 1 and 1000.",
        });
      }

      const id = String(item.menuItem);
      const newQuantity = (quantities.get(id) || 0) + item.quantity;

      if (newQuantity > 1000) {
        return res.status(400).json({
          message: "Combined quantity for an item cannot exceed 1000.",
        });
      }

      quantities.set(id, newQuantity);
    }

    const menuItemIds = [...quantities.keys()];

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      isAvailable: true,
      isDeleted: false,
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        message: "One or more selected items are unavailable or do not exist.",
      });
    }

    // Build bill items using database prices, never client-supplied prices.
    const billItems = menuItems.map((menuItem) => {
      const quantity = quantities.get(String(menuItem._id));
      const unitPrice = menuItem.price;
      const lineTotal = unitPrice * quantity;

      if (
        !Number.isSafeInteger(unitPrice) ||
        unitPrice < 0 ||
        !Number.isSafeInteger(lineTotal)
      ) {
        throw new Error("A menu item has an invalid price.");
      }

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        unitPrice,
        quantity,
        lineTotal,
      };
    });

    const subtotal = billItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    if (!Number.isSafeInteger(subtotal)) {
      return res.status(400).json({
        message: "The bill total exceeds the supported amount.",
      });
    }

    // Apply Parcel Charge only to Takeaway orders.
    const parcelCharge = orderType === "TAKEAWAY" ? 10 : 0;

    // Discounts are not enabled in this simple billing version.
    const discountAmount = 0;
    const totalAmount = subtotal + parcelCharge - discountAmount;

    if (!Number.isSafeInteger(totalAmount)) {
      return res.status(400).json({
        message: "The final bill total is invalid.",
      });
    }

    const order = await Order.create({
      billNumber: await generateBillNumber(),
      orderType,
      items: billItems,
      subtotal,
      parcelCharge,
      discountAmount,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Bill generated successfully.",
      bill: {
        id: order._id,
        billNumber: order.billNumber,
        orderType: order.orderType,
        items: order.items,
        subtotal: order.subtotal,
        parcelCharge: order.parcelCharge,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Generate bill error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Bill number conflict. Please try generating the bill again.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Bill validation failed.",
      });
    }

    return res.status(500).json({
      message: "Failed to generate bill.",
    });
  }
};

// GET /api/orders
// Retrieve saved bills, newest first
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name username")
      .lean();

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get bills error:", error);

    return res.status(500).json({
      message: "Failed to retrieve bills.",
    });
  }
};

// GET /api/orders/:id
// Retrieve a saved bill by MongoDB ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    const order = await Order.findById(id)
      .populate("createdBy", "name username")
      .lean();

    if (!order) {
      return res.status(404).json({
        message: "Bill not found.",
      });
    }

    return res.status(200).json({ bill: order });
  } catch (error) {
    console.error("Get bill error:", error);

    return res.status(500).json({
      message: "Failed to retrieve bill.",
    });
  }
};



const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Bill not found.",
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        message: "This bill is already cancelled.",
      });
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;

    await order.save();

    return res.status(200).json({
      message: "Bill cancelled successfully.",
      bill: {
        id: order._id,
        billNumber: order.billNumber,
        status: order.status,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      message: "Failed to cancel bill.",
    });
  }
};


module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};

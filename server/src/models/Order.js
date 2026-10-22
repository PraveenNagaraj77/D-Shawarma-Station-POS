
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number.",
      },
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    orderType: {
      type: String,
      enum: ["DINE_IN", "TAKEAWAY", "SWIGGY", "ZOMATO"],
      default: "TAKEAWAY",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) =>
          items.length > 0 && items.length <= 100,
        message: "A bill must contain between 1 and 100 items.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    parcelCharge: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "PLATFORM"],
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Bill status
    status: {
      type: String,
      enum: ["COMPLETED", "CANCELLED"],
      default: "COMPLETED",
      required: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderType: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);

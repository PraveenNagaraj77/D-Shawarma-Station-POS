
const Order = require("../models/Order");

const getIndiaDayBounds = (requestedDate) => {
  const indiaDate =
    requestedDate ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  // Validate YYYY-MM-DD and reject impossible dates.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(indiaDate)) {
    return null;
  }

  const [year, month, day] = indiaDate.split("-").map(Number);

  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  // Convert IST midnight to UTC.
  const start = new Date(
    Date.UTC(year, month - 1, day) - 330 * 60 * 1000
  );

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end, indiaDate };
};

const getDashboard = async (req, res) => {
  try {
    const dateBounds = getIndiaDayBounds(req.query.date);

    if (!dateBounds) {
      return res.status(400).json({
        message: "Invalid date. Use YYYY-MM-DD, for example 2026-10-19.",
      });
    }

    const { start, end, indiaDate } = dateBounds;

    const orders = await Order.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    })
      .select(
        "billNumber orderType paymentMethod totalAmount status createdAt"
      )
      .lean();

    // Legacy bills without a status count as completed.
    const completedOrders = orders.filter(
      (order) => order.status !== "CANCELLED"
    );

    const cancelledOrders = orders.filter(
      (order) => order.status === "CANCELLED"
    );

    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const createBreakdown = (keys) =>
      Object.fromEntries(
        keys.map((key) => [key, { count: 0, amount: 0 }])
      );

    const paymentBreakdown = createBreakdown([
      "CASH",
      "UPI",
      "PLATFORM",
    ]);

    const orderTypeBreakdown = createBreakdown([
      "DINE_IN",
      "TAKEAWAY",
      "SWIGGY",
      "ZOMATO",
    ]);

    for (const order of completedOrders) {
      const payment = paymentBreakdown[order.paymentMethod];

      if (payment) {
        payment.count += 1;
        payment.amount += order.totalAmount;
      }

      const orderType = orderTypeBreakdown[order.orderType];

      if (orderType) {
        orderType.count += 1;
        orderType.amount += order.totalAmount;
      }
    }

    return res.status(200).json({
      date: indiaDate,
      timezone: "Asia/Kolkata",

      summary: {
        totalRevenue,
        completedBillCount: completedOrders.length,
        cancelledBillCount: cancelledOrders.length,
        totalBillCount: orders.length,
        averageBillValue:
          completedOrders.length > 0
            ? Number(
                (totalRevenue / completedOrders.length).toFixed(2)
              )
            : 0,
      },

      paymentBreakdown,
      orderTypeBreakdown,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load dashboard data.",
    });
  }
};

module.exports = { getDashboard };


const Order = require("../models/Order");

const TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;

const formatIndiaDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

// Convert midnight IST to the corresponding UTC instant.
const getISTMidnightUTC = (year, month, day) =>
  new Date(
    Date.UTC(year, month - 1, day) -
      IST_OFFSET_MINUTES * 60 * 1000
  );

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const formatDateParts = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getPeriodBounds = (period, query) => {
  let startDate;
  let endDate;

  if (period === "custom") {
    const start = parseDate(query.startDate);
    const end = parseDate(query.endDate);

    if (!start || !end) {
      return {
        error: "Custom reports require valid startDate and endDate in YYYY-MM-DD format.",
      };
    }

    const startUTC = getISTMidnightUTC(
      start.year,
      start.month,
      start.day
    );
    const endUTC = getISTMidnightUTC(
      end.year,
      end.month,
      end.day
    );

    if (startUTC > endUTC) {
      return { error: "startDate must be on or before endDate." };
    }

    return {
      start: startUTC,
      end: addDays(endUTC, 1),
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }

  const selectedDate = parseDate(
    query.date || formatIndiaDate()
  );

  if (!selectedDate) {
    return {
      error: "Invalid date. Use YYYY-MM-DD, for example 2026-10-20.",
    };
  }

  let { year, month, day } = selectedDate;

  if (period === "daily") {
    startDate = { year, month, day };
    endDate = { year, month, day };
  } else if (period === "weekly") {
    const selectedUTC = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = selectedUTC.getUTCDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;

    const monday = new Date(
      selectedUTC.getTime() -
        daysSinceMonday * 24 * 60 * 60 * 1000
    );
    const sunday = addDays(monday, 6);

    startDate = {
      year: monday.getUTCFullYear(),
      month: monday.getUTCMonth() + 1,
      day: monday.getUTCDate(),
    };
    endDate = {
      year: sunday.getUTCFullYear(),
      month: sunday.getUTCMonth() + 1,
      day: sunday.getUTCDate(),
    };
  } else if (period === "monthly") {
    startDate = { year, month, day: 1 };

    const lastDay = new Date(
      Date.UTC(year, month, 0)
    ).getUTCDate();

    endDate = { year, month, day: lastDay };
  } else if (period === "yearly") {
    startDate = { year, month: 1, day: 1 };
    endDate = { year, month: 12, day: 31 };
  } else {
    return {
      error: "Invalid period. Use daily, weekly, monthly, yearly, or custom.",
    };
  }

  return {
    start: getISTMidnightUTC(
      startDate.year,
      startDate.month,
      startDate.day
    ),
    end: addDays(
      getISTMidnightUTC(
        endDate.year,
        endDate.month,
        endDate.day
      ),
      1
    ),
    startDate: formatDateParts(
      startDate.year,
      startDate.month,
      startDate.day
    ),
    endDate: formatDateParts(
      endDate.year,
      endDate.month,
      endDate.day
    ),
  };
};

const createBreakdown = (keys) =>
  Object.fromEntries(
    keys.map((key) => [key, { count: 0, amount: 0 }])
  );

const getSalesReport = async (req, res) => {
  try {
    const period = req.query.period || "daily";
    const bounds = getPeriodBounds(period, req.query);

    if (bounds.error) {
      return res.status(400).json({ message: bounds.error });
    }

    const { start, end, startDate, endDate } = bounds;

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

    // Older bills without status are treated as completed.
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
      period,
      startDate,
      endDate,
      timezone: TIMEZONE,

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
    console.error("Sales report error:", error);

    return res.status(500).json({
      message: "Failed to generate sales report.",
    });
  }
};

module.exports = { getSalesReport };

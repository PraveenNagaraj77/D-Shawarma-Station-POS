
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");

const { protect , authorize } = require("../middleware/authMiddleware");

// All order routes require authentication.
router.use(protect);

// Create an order
router.post("/", createOrder);

// Get all orders
router.get("/", getOrders);

//Cancel Order
router.patch("/:id/cancel", authorize("ADMIN", "SHOP_OWNER"), cancelOrder);

// Get a single order
router.get("/:id", getOrderById);

module.exports = router;

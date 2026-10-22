
const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("ADMIN", "SHOP_OWNER"),
  getDashboard
);

module.exports = router;

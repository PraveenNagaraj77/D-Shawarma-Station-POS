
const express = require("express");
const router = express.Router();

const { getSalesReport } = require("../controllers/salesReportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get(
  "/sales",
  protect,
  authorize("ADMIN", "SHOP_OWNER"),
  getSalesReport
);

module.exports = router;

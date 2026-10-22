
const express = require("express");
const {
  resetShopOwnerPassword,
} = require("../controllers/adminController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/users/:userId/reset-password",
  protect,
  authorize("ADMIN"),
  resetShopOwnerPassword
);

module.exports = router;

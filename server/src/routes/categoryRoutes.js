
const express = require("express");

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All category routes require authentication.
router.use(protect);

// View active categories.
router.get("/", getCategories);

// Only Admin and Shop Owner can manage categories.
router.post(
  "/",
  authorize("ADMIN", "SHOP_OWNER"),
  createCategory
);

router.patch(
  "/:id",
  authorize("ADMIN", "SHOP_OWNER"),
  updateCategory
);

router.delete(
  "/:id",
  authorize("ADMIN", "SHOP_OWNER"),
  deleteCategory
);

module.exports = router;

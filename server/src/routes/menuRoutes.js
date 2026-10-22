
const express = require("express");
const multer = require("multer");

const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
} = require("../controllers/menuController");

const {
  uploadMenuImage,
} = require("../controllers/uploadController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    callback(null, true);
  },
});

// All menu routes require authentication.
router.use(protect);

// View menu items.
router.get("/", getMenuItems);
router.get("/:id", getMenuItemById);

// Upload a menu image. Only admins and shop owners can upload.
router.post(
  "/upload-image",
  authorize("ADMIN", "SHOP_OWNER"),
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        const isSizeError = error.code === "LIMIT_FILE_SIZE";

        return res.status(400).json({
          success: false,
          message: isSizeError
            ? "Image must be 5 MB or smaller."
            : error.message || "Invalid image upload.",
        });
      }

      next();
    });
  },
  uploadMenuImage
);

// Manage menu items.
router.post(
  "/",
  authorize("ADMIN", "SHOP_OWNER"),
  createMenuItem
);

router.patch(
  "/:id/availability",
  authorize("ADMIN", "SHOP_OWNER"),
  updateMenuItemAvailability
);

router.patch(
  "/:id",
  authorize("ADMIN", "SHOP_OWNER"),
  updateMenuItem
);

router.delete(
  "/:id",
  authorize("ADMIN", "SHOP_OWNER"),
  deleteMenuItem
);

module.exports = router;

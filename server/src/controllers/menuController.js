
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");

// GET /api/menu
const getMenuItems = async (req, res) => {
  try {
    const { category, available, search } = req.query;

    const filter = { isDeleted: false };

    if (category !== undefined) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }

    if (available !== undefined) {
      if (available !== "true" && available !== "false") {
        return res.status(400).json({
          success: false,
          message: "Available must be true or false",
        });
      }

      filter.isAvailable = available === "true";
    }

    if (search !== undefined) {
      if (typeof search !== "string" || search.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search must be at most 100 characters",
        });
      }

      // Escape regex metacharacters so search text is treated literally.
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      if (escapedSearch) {
        filter.name = { $regex: escapedSearch, $options: "i" };
      }
    }

    // Public-facing menu results should only include active categories
    // and available products by default.
    const items = await MenuItem.find(filter)
      .populate({
        path: "category",
        select: "name sortOrder isActive",
        match: { isActive: true },
      })
      .sort({ name: 1 })
      .lean();

    const visibleItems = items.filter(
      (item) => item.category && item.category.isActive
    );

    return res.status(200).json({
      success: true,
      count: visibleItems.length,
      data: visibleItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve menu items",
    });
  }
};

// GET /api/menu/:id
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const item = await MenuItem.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate({
        path: "category",
        select: "name sortOrder isActive",
      })
      .lean();

    if (!item || !item.category || !item.category.isActive) {
      return res.status(404).json({
        success: false,
        message: "Active menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get menu item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve menu item",
    });
  }
};

// POST /api/menu
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable,
    } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Menu item name is required",
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      Math.round(price * 100) !== price * 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number with at most two decimals",
      });
    }

    if (
      typeof category !== "string" ||
      !mongoose.isValidObjectId(category)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category ID is required",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
    }

    if (imageUrl !== undefined && typeof imageUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "Image URL must be a string",
      });
    }

    if (
      imageUrl &&
      imageUrl.trim() &&
      !/^https?:\/\/\S+$/i.test(imageUrl.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Image URL must be a valid HTTP or HTTPS URL",
      });
    }

    if (
      isAvailable !== undefined &&
      typeof isAvailable !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean",
      });
    }

    const activeCategory = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!activeCategory) {
      return res.status(400).json({
        success: false,
        message: "An active category is required",
      });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      description,
      price,
      category: activeCategory._id,
      imageUrl: imageUrl?.trim() || "",
      isAvailable: isAvailable ?? true,
    });

    const populatedItem = await MenuItem.findById(item._id)
      .populate("category", "name sortOrder")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: populatedItem,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create menu item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create menu item",
    });
  }
};

// PATCH /api/menu/:id
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable,
    } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }

      updates.description = description;
    }

    if (price !== undefined) {
      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price <= 0 ||
        Math.round(price * 100) !== price * 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number with at most two decimals",
        });
      }

      updates.price = price;
    }

    if (category !== undefined) {
      if (
        typeof category !== "string" ||
        !mongoose.isValidObjectId(category)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid category ID is required",
        });
      }

      const activeCategory = await Category.findOne({
        _id: category,
        isActive: true,
      });

      if (!activeCategory) {
        return res.status(400).json({
          success: false,
          message: "An active category is required",
        });
      }

      updates.category = activeCategory._id;
    }

    if (imageUrl !== undefined) {
      if (typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image URL must be a string",
        });
      }

      if (
        imageUrl.trim() &&
        !/^https?:\/\/\S+$/i.test(imageUrl.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Image URL must be a valid HTTP or HTTPS URL",
        });
      }

      updates.imageUrl = imageUrl.trim();
    }

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be a boolean",
        });
      }

      updates.isAvailable = isAvailable;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("category", "name sortOrder")
      .lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Active menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: item,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update menu item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update menu item",
    });
  }
};

// PATCH /api/menu/:id/availability
const updateMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean",
      });
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isAvailable } },
      { new: true, runValidators: true }
    )
      .populate("category", "name sortOrder")
      .lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Active menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item availability updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update menu availability error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update menu item availability",
    });
  }
};

// DELETE /api/menu/:id
// Soft-delete the item so historical order references remain valid.
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isAvailable: false } },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Active menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete menu item",
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
};

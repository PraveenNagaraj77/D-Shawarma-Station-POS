
const mongoose = require("mongoose");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve categories",
    });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryData = { name: name.trim() };

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }

      categoryData.description = description;
    }

    if (sortOrder !== undefined) {
      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a non-negative integer",
        });
      }

      categoryData.sortOrder = sortOrder;
    }

    const category = await Category.create(categoryData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create category error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create category",
    });
  }
};

// PATCH /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name must be a non-empty string",
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

    if (sortOrder !== undefined) {
      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a non-negative integer",
        });
      }

      updates.sortOrder = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Active category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update category error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update category",
    });
  }
};

// DELETE /api/categories/:id
// Soft-deactivate a category rather than physically deleting it.
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Active category not found",
      });
    }

    // Do not deactivate a category while it has active menu items.
    // MenuItem will be created in the next step.
    const hasActiveItems = await MenuItem.exists({
      category: category._id,
      isDeleted: false,
    });

    if (hasActiveItems) {
      return res.status(409).json({
        success: false,
        message:
          "This category contains menu items. Move or deactivate those items first.",
      });
    }

    category.isActive = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate category",
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

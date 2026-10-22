
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [60, "Category name cannot exceed 60 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [250, "Description cannot exceed 250 characters"],
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Sort order must be an integer",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate category names, ignoring capitalization
// and leading/trailing spaces.
categorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

module.exports = mongoose.model("Category", categorySchema);

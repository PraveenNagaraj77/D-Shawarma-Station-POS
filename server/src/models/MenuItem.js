
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Menu item price is required"],
      min: [0.01, "Price must be greater than zero"],
      validate: {
        validator: (value) =>
          Number.isFinite(value) &&
          Math.round(value * 100) === value * 100,
        message: "Price can have at most two decimal places",
      },
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2048, "Image URL is too long"],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Support filtering items by category and status.
menuItemSchema.index({
  category: 1,
  isDeleted: 1,
  isAvailable: 1,
});

menuItemSchema.index({
  name: 1,
  isDeleted: 1,
});

module.exports = mongoose.model("MenuItem", menuItemSchema);

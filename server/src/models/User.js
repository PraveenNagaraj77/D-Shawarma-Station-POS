
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },

    role: {
      type: String,
      enum: ['ADMIN', 'SHOP_OWNER'],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Increment this to invalidate existing JWTs.
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

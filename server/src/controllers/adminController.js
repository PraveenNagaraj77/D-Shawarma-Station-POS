
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const resetShopOwnerPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body || {};

    // Validate the target user's ID.
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate the new password fields.
    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation are required",
      });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters long",
      });
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must not exceed 72 UTF-8 bytes",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation do not match",
      });
    }

    // Only a Shop Owner account can be reset through this endpoint.
    // The route also restricts access to Admins.
    const user = await User.findOne({
      _id: userId,
      role: "SHOP_OWNER",
    }).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Shop Owner account not found",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Shop Owner password reset successfully. The user must log in again.",
    });
  } catch (error) {
    console.error("Admin password reset error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password at this time",
    });
  }
};

module.exports = { resetShopOwnerPassword };

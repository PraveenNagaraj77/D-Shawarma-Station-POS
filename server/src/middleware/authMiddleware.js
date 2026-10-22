const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and identify the current user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check the user still exists and is active
    const user = await User.findOne({
      _id: decoded.sub,
      isActive: true,
    }).select("_id name username role tokenVersion");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // Attach the trusted database user to the request
    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request",
    });
  }
};

// Restrict access to specified roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = { protect, authorize };

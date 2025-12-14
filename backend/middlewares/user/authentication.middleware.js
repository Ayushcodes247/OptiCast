const { userModel } = require("@models/user.model");
const { blackListTokenModel } = require("@models/blackListToken.model");
const jwt = require("jsonwebtoken");
const TOKEN_NAME = "auth_token";

module.exports.authentication = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      req.user = req.user;
      return next();
    }

    const token =
      req.cookies?.[TOKEN_NAME] ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication token missing." });
    }

    const blackListed = await blackListTokenModel.findOne({ token });
    if (blackListed) {
      return res.status(401).json({
        success: false,
        message: "Token is blacklisted. Please login again.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    const user = await userModel.findById(decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found for the provided token.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[Authentication Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { STATUS_CODES, ERROR_MESSAGES } from "../constants/statusCodes.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
        });
      }
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }
  }

  if (!token) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }
};

// Optional: Admin middleware
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: "Admin access required",
    });
  }
};

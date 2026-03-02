import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.SERVER_ERROR;
  const message = err.message || "Server Error";

  logger.error("API Error", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: "Resource not found",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(STATUS_CODES.CONFLICT).json({
      success: false,
      message: `${field} already exists`,
      field,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((val) => val.message);

    return res.status(STATUS_CODES.UNPROCESSABLE).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: "Token expired",
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

export default errorHandler;

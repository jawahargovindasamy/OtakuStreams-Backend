import { STATUS_CODES } from '../constants/statusCodes.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: error.message,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    return res.status(STATUS_CODES.CONFLICT).json({
      success: false,
      message: error.message,
      field,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(STATUS_CODES.UNPROCESSABLE).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
    });
  }

  res.status(err.statusCode || STATUS_CODES.SERVER_ERROR).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
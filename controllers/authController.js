import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { generateRandomPassword } from "../utils/generatePassword.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../utils/sendEmail.js";
import { STATUS_CODES, ERROR_MESSAGES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    logger.info("Register attempt", {
      email,
      username,
      ip: req.ip,
    });

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      logger.warn("Register failed - User already exists", {
        email,
        username,
      });

      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message:
          userExists.email === email
            ? ERROR_MESSAGES.EMAIL_EXISTS
            : ERROR_MESSAGES.USERNAME_EXISTS,
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      logger.info("User registered successfully", {
        userId: user._id,
        email: user.email,
      });

      res.status(STATUS_CODES.CREATED).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error) {
    logger.error("Register error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Login attempt", {
      email,
      ip: req.ip,
    });

    // Check for user email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      logger.warn("Login failed", { email });

      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logger.warn("Login failed", {
        userId: user._id,
      });

      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    logger.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        notificationIgnore: user.notificationIgnore,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error("Login error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    logger.info("Fetch current user", {
      userId: req.user.id,
    });

    const user = await User.findById(req.user.id);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("GetMe error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Forgot password - Generate random password and send via email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info("Forgot password request", {
      email,
      ip: req.ip,
    });

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Forgot password - Email not found", { email });

      // Return success even if user not found (security best practice)
      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: "If an account exists, a password reset email has been sent",
      });
    }

    // Generate random password
    const newPassword = generateRandomPassword(12);

    // Update user password
    user.password = newPassword;
    await user.save();

    // Send email with new password
    try {
      await sendPasswordResetEmail(email, newPassword);

      logger.info("Password reset email sent", {
        userId: user._id,
      });

      res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } catch (emailError) {
      logger.error("Password reset email failed", {
        message: emailError.message,
        userId: user._id,
      });

      return res.status(STATUS_CODES.SERVER_ERROR).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }
  } catch (error) {
    logger.error("Forgot password error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset password (when logged in)
// @route   POST /api/auth/reset-password
// @access  Private
export const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    logger.info("Reset password attempt", {
      userId: req.user.id,
    });

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      logger.warn("Reset password failed - Incorrect password", {
        userId: req.user.id,
      });

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    await sendPasswordChangedEmail(user.email);

    logger.info("Password updated successfully", {
      userId: user._id,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error("Reset password error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  logger.info("User logged out", {
    userId: req.user?.id,
  });

  // Since we're using JWT, we don't need to do anything server-side
  // The client should remove the token
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Logged out successfully",
  });
};

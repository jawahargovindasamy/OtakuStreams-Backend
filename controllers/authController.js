import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { generateRandomPassword } from "../utils/generatePassword.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../utils/sendEmail.js";
import { STATUS_CODES, ERROR_MESSAGES } from "../constants/statusCodes.js";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
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

    // Check for user email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

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
    const user = await User.findById(req.user.id);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
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

    const user = await User.findOne({ email });

    if (!user) {
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

      res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } catch (emailError) {
      // If email fails, revert password change
      console.error("Email send failed:", emailError);
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }
  } catch (error) {
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

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
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

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
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
  // Since we're using JWT, we don't need to do anything server-side
  // The client should remove the token
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Logged out successfully",
  });
};

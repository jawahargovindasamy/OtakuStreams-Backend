import User from "../models/User.js";
import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      logger.warn("Update profile failed - user not found", {
        userId: req.user.id,
      });

      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("User profile updated", {
      userId: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Update profile failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private

export const updateSettings = async (req, res) => {
  try {
    const { watching, on_hold, plan_to_watch, completed, dropped } = req.body;
    const updateData = {};

    if (watching !== undefined)
      updateData["notificationIgnore.watching"] = watching;
    if (on_hold !== undefined)
      updateData["notificationIgnore.on_hold"] = on_hold;
    if (plan_to_watch !== undefined)
      updateData["notificationIgnore.plan_to_watch"] = plan_to_watch;
    if (completed !== undefined)
      updateData["notificationIgnore.completed"] = completed;
    if (dropped !== undefined)
      updateData["notificationIgnore.dropped"] = dropped;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!user) {
      logger.warn("Update settings failed - user not found", {
        userId: req.user.id,
      });

      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("User settings updated", {
      userId: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Update settings failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const user= await User.findByIdAndDelete(req.user.id);

    if (!user) {
      logger.warn("Delete account failed - user not found", {
        userId: req.user.id,
      });

      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("User account deleted", {
      userId: req.user.id,
      email: user.email,
    });

    // TODO: Also delete user's watchlist and continue watching data

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error("Delete account failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });
    
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

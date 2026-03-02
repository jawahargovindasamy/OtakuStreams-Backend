import Notification from "../models/Notification.js";
import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

export const getNotifications = async (req, res) => {
  try {
    const data = await Notification.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    logger.info("Notifications fetched", {
      userId: req.user.id,
      count: data.length,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      data,
    });
  } catch (error) {
    logger.error("Fetch notifications failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      logger.warn("Notification not found for markAsRead", {
        userId: req.user.id,
        notificationId: req.params.id,
      });

      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Notification not found",
      });
    }

    logger.info("Notification marked as read", {
      userId: req.user.id,
      notificationId: req.params.id,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Marked as read",
    });
  } catch (error) {
    logger.error("Mark as read failed", {
      userId: req.user?.id,
      notificationId: req.params.id,
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id,
    });

    logger.info("All notifications cleared", {
      userId: req.user.id,
      deletedCount: result.deletedCount,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    logger.error("Clear notifications failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
};

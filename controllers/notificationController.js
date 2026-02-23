import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const data = await Notification.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
  );

  res.json({ message: "Marked as read" });
};

export const clearAllNotifications = async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.json({ message: "All cleared" });
};

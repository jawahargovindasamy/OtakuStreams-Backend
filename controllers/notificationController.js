import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  const data = await Notification.find({ user: req.user.id }).sort({
    createdAt: -1,
  });

  res.json(data);
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

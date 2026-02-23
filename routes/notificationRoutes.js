import express from "express";

import {
  getNotifications,
  markAsRead,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { generateEpisodeNotifications } from "../services/notificationService.js";

import { protect } from "../middleware/auth.js";
import { syncTodaySchedule } from "../services/scheduleService.js";

const router = express.Router();

router.get("/test-notifications", async (req, res) => {
  try {
    await generateEpisodeNotifications();
    res.json({ message: "done" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/test-sync", async (req, res) => {
  try {
    await syncTodaySchedule();
    res.json({ message: "Schedule synced" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear", protect, clearAllNotifications);

export default router;

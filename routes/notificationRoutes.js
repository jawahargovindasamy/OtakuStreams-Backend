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
    let targetDate = req.query.date || null;

    if (req.query.yesterday === "true") {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      targetDate = yesterday.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
    }

    const result = await syncTodaySchedule(targetDate);
    if (result && !result.success) {
      return res.status(503).json({
        success: false,
        message: result.reason || "Schedule sync failed due to upstream AniList outage",
      });
    }
    res.json({ success: true, message: "Schedule synced successfully", ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear", protect, clearAllNotifications);

export default router;

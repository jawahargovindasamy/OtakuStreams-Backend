import express from "express";

import {
  getNotifications,
  markAsRead,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { generateEpisodeNotifications } from "../services/notificationService.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/test-notifications", async (req, res) => {
  try {
    await generateEpisodeNotifications();
    res.json({ message: "done" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear", protect, clearAllNotifications);

export default router;

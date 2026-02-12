import express from "express";
import {
  updateProgress,
  getContinueWatching,
  getAnimeProgress,
  deleteProgress,
  clearAllProgress,
} from "../controllers/continueWatchingController.js";
import { protect } from "../middleware/auth.js";
import {
  validate,
  continueWatchingValidation,
} from "../middleware/validator.js";

const router = express.Router();

router.post("/", protect, validate(continueWatchingValidation), updateProgress);
router.get("/", protect, getContinueWatching);
router.get("/:animeId", protect, getAnimeProgress);
router.delete("/:animeId", protect, deleteProgress);
router.delete("/", protect, clearAllProgress);

export default router;

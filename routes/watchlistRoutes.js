import express from "express";
import {
  addToWatchlist,
  getWatchlist,
  getWatchlistStats,
  updateWatchlistItem,
  removeFromWatchlist,
  checkWatchlistStatus,
} from "../controllers/watchlistController.js";
import { protect } from "../middleware/auth.js";
import { validate, watchlistValidation } from "../middleware/validator.js";

const router = express.Router();

router.post("/", protect, validate(watchlistValidation), addToWatchlist);
router.get("/", protect, getWatchlist);
router.get("/stats", protect, getWatchlistStats);
router.get("/check/:animeId", protect, checkWatchlistStatus);
router.put("/:id", protect, updateWatchlistItem);
router.delete("/:id", protect, removeFromWatchlist);

export default router;

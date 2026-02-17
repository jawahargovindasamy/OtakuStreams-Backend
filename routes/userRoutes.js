import express from "express";
import {
  updateProfile,
  deleteAccount,
  updateSettings,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.put("/settings", protect, updateSettings);
router.delete("/account", protect, deleteAccount);

export default router;

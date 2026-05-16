import express from "express";
import {
  updateProfile,
  deleteAccount,
  updateSettings,
  updatePreferences,
  getPreferences,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { validate, userPreferencesValidation } from "../middleware/validator.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.put("/settings", protect, updateSettings);
router.get("/preferences", protect, getPreferences);
router.put(
  "/preferences",
  protect,
  validate(userPreferencesValidation),
  updatePreferences,
);
router.delete("/account", protect, deleteAccount);

export default router;

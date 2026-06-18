import express from "express";
import {
  getLatestVersion,
  registerVersion,
  rollbackVersion,
} from "../controllers/appVersionController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import {
  validate,
  appVersionRegisterValidation,
  appVersionRollbackValidation,
} from "../middleware/validator.js";

const router = express.Router();

// Public route to check for updates
router.get("/version", getLatestVersion);

// Webhook-authenticated route to register a new build (HMAC verified inside controller)
router.post("/version", validate(appVersionRegisterValidation), registerVersion);

// Admin-authenticated route to trigger a rollback
router.post(
  "/version/rollback",
  protect,
  adminOnly,
  validate(appVersionRollbackValidation),
  rollbackVersion
);

export default router;

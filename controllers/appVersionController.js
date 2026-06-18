import crypto from "crypto";
import AppVersion from "../models/AppVersion.js";
import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

/**
 * GET /api/app/version
 * Public endpoint to fetch update decisions for a client app
 */
export const getLatestVersion = async (req, res) => {
  try {
    const { platform, versionCode, channel = "stable", environment = "production", deviceId } = req.query;

    if (!platform || !versionCode) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "platform and versionCode are required query parameters",
      });
    }

    const clientVersionCode = parseInt(versionCode, 10);
    if (isNaN(clientVersionCode)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "versionCode must be a valid number",
      });
    }

    // Find the latest active release
    const latestRelease = await AppVersion.findOne({
      platform,
      environment,
      channel,
      status: "active",
    }).sort({ versionCode: -1 });

    if (!latestRelease) {
      return res.status(STATUS_CODES.SUCCESS).json({
        updateAvailable: false,
        forceUpdate: false,
        message: "No active release found for this configuration",
      });
    }

    let updateAvailable = latestRelease.versionCode > clientVersionCode;
    let forceUpdate = clientVersionCode < latestRelease.minSupportedVersionCode || latestRelease.forceUpdate;

    // Rollout percentage check
    if (updateAvailable && latestRelease.rolloutPercentage < 100 && deviceId) {
      // DJB2 hash algorithm to map device ID to a bucket [0, 99]
      let hash = 0;
      for (let i = 0; i < deviceId.length; i++) {
        hash = (hash * 33) ^ deviceId.charCodeAt(i);
      }
      const bucket = Math.abs(hash) % 100;

      if (bucket >= latestRelease.rolloutPercentage) {
        updateAvailable = false;
        forceUpdate = false; // Don't force update if user is not in the rollout bucket
      }
    }

    return res.status(STATUS_CODES.SUCCESS).json({
      updateAvailable,
      forceUpdate,
      latest: {
        versionName: latestRelease.versionName,
        versionCode: latestRelease.versionCode,
        artifact: {
          name: latestRelease.artifact.name,
          url: latestRelease.artifact.url,
          sha256: latestRelease.artifact.sha256,
          size: latestRelease.artifact.size,
        },
        releaseNotes: latestRelease.releaseNotes,
      },
    });
  } catch (error) {
    logger.error("Error in getLatestVersion controller", { message: error.message });
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * POST /api/app/version
 * Secured endpoint to register a new build release via HMAC-SHA256 signature
 */
export const registerVersion = async (req, res) => {
  try {
    const secret = process.env.RELEASE_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("RELEASE_WEBHOOK_SECRET is not configured in environment variables");
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        success: false,
        message: "Webhook secret key is not configured on the server",
      });
    }

    const signature = req.headers["x-release-signature"];
    if (!signature) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Missing X-Release-Signature header",
      });
    }

    // Verify HMAC-SHA256 signature over the raw stringified body
    const payload = JSON.stringify(req.body);
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (signature !== computedSignature) {
      logger.warn("Unauthorized attempt to post release metadata (HMAC mismatch)");
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Invalid signature verification key",
      });
    }

    const { platform, versionCode, environment, channel } = req.body;

    // Find and update or create (run pre-save hooks correctly)
    let version = await AppVersion.findOne({
      platform,
      versionCode,
      environment,
      channel,
    });

    if (version) {
      // Overwrite/Update fields for idempotence
      Object.assign(version, req.body);
    } else {
      version = new AppVersion(req.body);
    }

    await version.save();

    logger.info("Successfully registered/updated app release metadata", {
      platform,
      versionName: version.versionName,
      versionCode,
      environment,
      channel,
    });

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      data: version,
    });
  } catch (error) {
    logger.error("Error in registerVersion controller", { message: error.message, stack: error.stack });
    console.error("FULL ERROR STACK:", error);
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * POST /api/app/version/rollback
 * Secured endpoint for admin-triggered version rollbacks
 */
export const rollbackVersion = async (req, res) => {
  try {
    const { platform, environment, channel, rollbackToCode } = req.body;

    // Ensure the target rollback release exists
    const targetRelease = await AppVersion.findOne({
      platform,
      environment,
      channel,
      versionCode: rollbackToCode,
    });

    if (!targetRelease) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: `Rollback target version code ${rollbackToCode} not found`,
      });
    }

    if (targetRelease.status === "recalled") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Cannot rollback to a recalled version",
      });
    }

    // If target version was draft, promote to active
    if (targetRelease.status === "draft") {
      targetRelease.status = "active";
      await targetRelease.save();
    }

    // Transition all active releases with a higher versionCode to recalled
    const activeReleasesToRecall = await AppVersion.find({
      platform,
      environment,
      channel,
      versionCode: { $gt: rollbackToCode },
      status: "active",
    });

    for (const release of activeReleasesToRecall) {
      release.status = "recalled";
      await release.save();
    }

    logger.info("Successfully completed release rollback operations", {
      platform,
      environment,
      channel,
      rolledBackTo: rollbackToCode,
      recalledCount: activeReleasesToRecall.length,
    });

    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: `Successfully rolled back to version ${targetRelease.versionName} (${rollbackToCode})`,
      currentActiveRelease: targetRelease,
      recalledReleases: activeReleasesToRecall.map(r => r.versionCode),
    });
  } catch (error) {
    logger.error("Error in rollbackVersion controller", { message: error.message });
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

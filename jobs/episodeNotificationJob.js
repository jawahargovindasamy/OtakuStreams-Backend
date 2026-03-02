import cron from "node-cron";
import { generateEpisodeNotifications } from "../services/notificationService.js";
import logger from "../utils/logger.js";

export const startEpisodeJob = () => {
  logger.info("Episode notification cron job initialized");
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    const startTime = Date.now();
    try {
      logger.info("Episode notification job started");

      await generateEpisodeNotifications();

      const duration = Date.now() - startTime;

      logger.info(
        `Episode notification job completed successfully in ${duration}ms`,
      );
    } catch (error) {
      logger.error("Episode notification job failed", {
        message: error.message,
        stack: error.stack,
      });
    }
  });
};

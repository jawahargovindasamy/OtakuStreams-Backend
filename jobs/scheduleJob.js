import cron from "node-cron";
import { syncTodaySchedule } from "../services/scheduleService.js";
import logger from "../utils/logger.js";

export const startScheduleJob = () => {
  logger.info("Schedule sync cron job initialized", {
    job: "scheduleSync",
    schedule: "15 6 * * *",
    timezone: "Asia/Kolkata",
  });

  // Run daily at 6:15 AM
  cron.schedule(
    "15 6 * * *",
    async () => {
      const startTime = Date.now();

      try {
        logger.info("Schedule sync job started", {
          job: "scheduleSync",
        });

        const result = await syncTodaySchedule();

        const duration = Date.now() - startTime;

        if (result && !result.success) {
          logger.warn("Schedule sync job skipped/incomplete due to upstream issue", {
            job: "scheduleSync",
            reason: result.reason,
            duration: `${duration}ms`,
          });
        } else {
          logger.info("Schedule sync job completed successfully", {
            job: "scheduleSync",
            duration: `${duration}ms`,
          });
        }
      } catch (error) {
        logger.error("Schedule sync job failed", {
          job: "scheduleSync",
          message: error.message,
          stack: error.stack,
        });
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );
};

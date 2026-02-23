import cron from "node-cron";
import { generateEpisodeNotifications } from "../services/notificationService.js";

export const startEpisodeJob = () => {
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("🔔 Running episode notification job...");
    await generateEpisodeNotifications();
  });
};

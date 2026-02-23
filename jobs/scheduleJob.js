import cron from "node-cron";
import { syncTodaySchedule } from "../services/scheduleService.js";

export const startScheduleJob = () => {
  // Run daily at 1 AM
  cron.schedule("15 0 * * *", async () => {
    console.log("📅 Running schedule sync job...");
    await syncTodaySchedule();
  },{
    timezone: "Asia/Kolkata",
  });
};

import cron from "node-cron";
import { generateEpisodeNotifications } from "../services/notificationService.js";

export const startEpisodeJob = ()=>{
    cron.schedule("0 * * * *", async()=>{
        console.log("Checking anime Schedules...");
        await generateEpisodeNotifications();
    });
}
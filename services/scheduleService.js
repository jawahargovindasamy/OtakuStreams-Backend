import ScheduledEpisode from "../models/ScheduledEpisode.js";
import { fetchScheduleByDate } from "../utils/apiClient.js";

export const syncTodaySchedule = async () => {
  try {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const todayStr = `${year}-${month}-${day}`;

    console.log("📅 Syncing schedule:", todayStr);

    const todaySchedule = await fetchScheduleByDate(todayStr);

    if (!todaySchedule.length) {
      console.log("No anime scheduled today.");
      return;
    }

    for (const anime of todaySchedule) {
      await ScheduledEpisode.updateOne(
        {
          animeId: anime.id,
          episode: anime.episode,
        },
        {
          $setOnInsert: {
            animeTitle: anime.name,
            airingTimestamp: anime.airingTimestamp,
            airingDate: todayStr,
            isNotified: false,
          },
        },
        { upsert: true },
      );
    }

    console.log("✅ Schedule synced.");
  } catch (error) {
    console.error("❌ Schedule sync failed:", error.message);
  }
};

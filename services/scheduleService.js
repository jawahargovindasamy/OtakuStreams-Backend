import ScheduledEpisode from "../models/ScheduledEpisode.js";
import { fetchScheduleByDate } from "../utils/apiClient.js";
import logger from "../utils/logger.js";

export const syncTodaySchedule = async () => {
  const startTime = Date.now();

  try {
    
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    logger.info("Schedule sync started", {
      date: todayStr,
    });

    const todaySchedule = await fetchScheduleByDate(todayStr);

    if (!todaySchedule?.length) {
      logger.info("No anime scheduled for today", {
        date: todayStr,
      });
      return;
    }

    logger.info("Fetched schedule data", {
      date: todayStr,
      count: todaySchedule.length,
    });

    let upsertedCount = 0;

    for (const anime of todaySchedule) {
      try {
        const result = await ScheduledEpisode.updateOne(
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

        if (result.upsertedCount > 0) {
          upsertedCount++;
        }
      } catch (error) {
        logger.error("Failed to upsert scheduled episode", {
          animeId: anime.id,
          episode: anime.episode,
          message: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info("Schedule sync completed", {
      date: todayStr,
      totalFetched: todaySchedule.length,
      newInserted: upsertedCount,
      duration: `${duration}ms`,
    });
  } catch (error) {
    logger.error("Schedule sync job crashed", {
      message: error.message,
      stack: error.stack,
    });
  }
};

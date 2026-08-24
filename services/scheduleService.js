import axios from "axios";
import ScheduledEpisode from "../models/ScheduledEpisode.js";
import { checkMegaplayAvailability } from "./megaplayService.js";
import logger from "../utils/logger.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform a POST request with automatic retry on 429 (Rate Limit) or 5xx (Server Error).
 */
const fetchWithRetry = async (url, data, config, retries = 5, delay = 2000) => {
  try {
    return await axios.post(url, data, config);
  } catch (error) {
    const isRateLimit = error.response && error.response.status === 429;
    const isServerError = error.response && error.response.status >= 500;

    if ((isRateLimit || isServerError) && retries > 0) {
      const retryAfter = error.response.headers?.["retry-after"];
      const waitTime = isRateLimit && retryAfter
        ? (parseInt(retryAfter, 10) * 1000)
        : delay;

      logger.warn(`AniList API returned ${error.response.status}. Retrying in ${waitTime}ms... (${retries} attempts remaining)`);
      await sleep(waitTime);
      return fetchWithRetry(url, data, config, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const syncTodaySchedule = async () => {
  const startTime = Date.now();

  try {
    // 1. Get current date in Asia/Kolkata
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    logger.info("Schedule sync started", {
      date: todayStr,
    });

    // 2. Create start and end of the day timestamps for Asia/Kolkata
    // todayStr is "YYYY-MM-DD"
    const startOfDay = new Date(`${todayStr}T00:00:00+05:30`).getTime() / 1000;
    const endOfDay = new Date(`${todayStr}T23:59:59+05:30`).getTime() / 1000;

    let hasNextPage = true;
    let page = 1;
    let allSchedules = [];

    const query = `
      query ($start: Int, $end: Int, $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            id 
            airingAt 
            episode 
            media { 
              id 
              idMal 
              format
              title { english romaji native } 
            }
          }
        }
      }
    `;

    while (hasNextPage) {
      const variables = {
        start: Math.floor(startOfDay),
        end: Math.floor(endOfDay),
        page: page,
      };

      const res = await fetchWithRetry(
        "https://graphql.anilist.co",
        {
          query,
          variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      );

      const pageData = res.data?.data?.Page;
      if (!pageData) break;

      if (pageData.airingSchedules && pageData.airingSchedules.length > 0) {
        allSchedules.push(...pageData.airingSchedules);
      }

      hasNextPage = pageData.pageInfo?.hasNextPage;
      page++;
    }

    // Exclude unwanted media formats
    allSchedules = allSchedules.filter(item => {
      const format = item.media?.format;
      return format !== 'TV_SHORT' && format !== 'MANGA' && format !== 'NOVEL' && format !== 'ONE_SHOT' && format !== 'MUSIC';
    });

    if (!allSchedules.length) {
      logger.info("No anime scheduled for today", {
        date: todayStr,
      });
      return;
    }

    logger.info("Fetched schedule data from AniList", {
      date: todayStr,
      count: allSchedules.length,
    });

    let upsertedCount = 0;

    // Group schedules by animeId
    const schedulesByAnime = {};
    for (const schedule of allSchedules) {
      const media = schedule.media;
      if (!media) continue;
      const animeId = media.id.toString();
      if (!schedulesByAnime[animeId]) {
        schedulesByAnime[animeId] = [];
      }
      schedulesByAnime[animeId].push(schedule);
    }

    for (const animeId in schedulesByAnime) {
      const group = schedulesByAnime[animeId];
      // Sort episodes ascending
      group.sort((a, b) => a.episode - b.episode);
      
      const firstSchedule = group[0];
      const media = firstSchedule.media;
      const title = media.title?.english || media.title?.romaji || media.title?.native || "Unknown Title";
      const episodeMin = firstSchedule.episode;

      let shouldInsertGroup = true;

      if (episodeMin > 1) {
        shouldInsertGroup = false;
        const prevEp = episodeMin - 1;

        const status = await checkMegaplayAvailability(
          media.id.toString(),
          media.idMal ? media.idMal.toString() : null,
          prevEp
        );

        if (status === "AVAILABLE" || status === "VERIFICATION_FAILED") {
          shouldInsertGroup = true;
          if (status === "VERIFICATION_FAILED") {
            logger.warn(`Verification failed for previous episode ${prevEp} of "${title}". Falling back to allow insertion.`);
          }
        }
      }

      if (!shouldInsertGroup) {
        logger.info("Skipping schedule insert for group: previous episode not available on Megaplay", {
          animeId,
          title,
          episodes: group.map(s => s.episode),
        });
        continue;
      }

      // Upsert all schedules in this group
      for (const schedule of group) {
        try {
          const result = await ScheduledEpisode.updateOne(
            {
              animeId: media.id.toString(),
              episode: schedule.episode,
            },
            {
              $setOnInsert: {
                malId: media.idMal ? media.idMal.toString() : null,
                animeTitle: title,
                airingTimestamp: schedule.airingAt * 1000, // convert to ms
                airingDate: todayStr,
                isNotified: false,
              },
            },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            upsertedCount++;
          }
        } catch (error) {
          logger.error("Failed to upsert scheduled episode", {
            animeId: media.id,
            episode: schedule.episode,
            message: error.message,
          });
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.info("Schedule sync completed", {
      date: todayStr,
      totalFetched: allSchedules.length,
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

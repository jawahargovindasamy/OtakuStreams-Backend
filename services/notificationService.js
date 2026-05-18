import axios from "axios";
import Notification from "../models/Notification.js";
import Watchlist from "../models/Watchlist.js";
import ScheduledEpisode from "../models/ScheduledEpisode.js";
import logger from "../utils/logger.js";

export const generateEpisodeNotifications = async () => {
  const jobStart = Date.now();
  try {
    logger.info("Episode notification job started");

    const pendingEpisodes = await ScheduledEpisode.find({
      isNotified: false,
      airingTimestamp: { $lte: Date.now() },
    });

    if (!pendingEpisodes.length) {
      logger.info("No pending scheduled episodes found that have aired");
      return;
    }

    logger.info("Pending aired episodes found", {
      count: pendingEpisodes.length,
    });

    let totalNotificationsSent = 0;
    
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Referer: "https://megaplay.buzz/",
    };

    for (const scheduled of pendingEpisodes) {
      const { animeId, malId, episode } = scheduled;

      try {
        logger.debug("Checking Megaplay availability", {
          animeId,
          malId,
          episode,
        });

        const subPatterns = [
          `https://megaplay.buzz/stream/ani/${animeId}/${episode}/sub`,
        ];
        if (malId) {
          subPatterns.push(`https://megaplay.buzz/stream/mal/${malId}/${episode}/sub`);
        }

        let isAvailable = false;

        for (const url of subPatterns) {
          try {
            const response = await axios.get(url, { headers, timeout: 8000 });
            const bodyStr =
              typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data);

            if (
              response.status === 200 &&
              !bodyStr.includes("Oops! Something went wrong")
            ) {
              isAvailable = true;
              break;
            }
          } catch (error) {
            // Silently fail and try next pattern if any
          }
        }

        if (!isAvailable) {
          logger.info("Episode not uploaded on Megaplay yet", {
            animeId,
            episode,
          });
          continue;
        }

        // Get watchlist users
        const watchlistItems = await Watchlist.find({
          animeId,
        }).populate({
          path: "user",
          select: "_id notificationIgnore",
        });

        if (!watchlistItems.length) {
          logger.info("No users watching this anime", { animeId });
          scheduled.isNotified = true;
          await scheduled.save();
          continue;
        }

        const notifications = [];

        for (const item of watchlistItems) {
          const user = item.user;
          if (!user) continue;

          if (user.notificationIgnore?.[item.status]) continue;

          notifications.push({
            user: user._id,
            animeId,
            malId,
            animeTitle: item.animeTitle,
            animeImage: item.animeImage,
            episode,
            message: `Episode ${episode} of ${item.animeTitle} is now available!`,
          });
        }

        if (notifications.length) {
          await Notification.insertMany(notifications, {
            ordered: false,
          });

          totalNotificationsSent += notifications.length;

          logger.info("Notifications sent", {
            animeId,
            episode,
            count: notifications.length,
          });
        } else {
          logger.info("No eligible users for notification", {
            animeId,
          });
        }

        scheduled.isNotified = true;
        await scheduled.save();
      } catch (error) {
        logger.error("Failed processing scheduled episode", {
          animeId,
          episode,
          message: error.message,
          stack: error.stack,
        });
      }
    }

    const duration = Date.now() - jobStart;

    logger.info("Episode notification job completed", {
      totalNotificationsSent,
      duration: `${duration}ms`,
    });
  } catch (error) {
    logger.error("Episode notification job crashed", {
      message: error.message,
      stack: error.stack,
    });
  }
};

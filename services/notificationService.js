import Notification from "../models/Notification.js";
import Watchlist from "../models/Watchlist.js";
import ScheduledEpisode from "../models/ScheduledEpisode.js";
import { fetchEpisodesCount } from "../utils/apiClient.js";
import logger from "../utils/logger.js";

export const generateEpisodeNotifications = async () => {
  const jobStart = Date.now();
  try {
    logger.info("Episode notification job started");

    const pendingEpisodes = await ScheduledEpisode.find({
      isNotified: false,
    });

    if (!pendingEpisodes.length) {
      logger.info("No pending scheduled episodes found");
      return;
    }

    logger.info("Pending episodes found", {
      count: pendingEpisodes.length,
    });

    let totalNotificationsSent = 0;

    for (const scheduled of pendingEpisodes) {
      const { animeId, episode } = scheduled;

      try {
        logger.debug("Processing scheduled episode", {
          animeId,
          episode,
        });

        // 1️⃣ Fetch episode list
        const { episodes } = await fetchEpisodesCount(animeId);

        if (!episodes || !episodes.length) {
          logger.warn("No episodes returned from API", { animeId });
          continue;
        }

        // 2️⃣ Check if specific episode exists
        const episodeData = episodes.find((ep) => ep.number === episode);

        if (!episodeData) {
          logger.info("Episode not uploaded yet", {
            animeId,
            episode,
          });
          continue;
        }

        const episodeId = episodeData.episodeId;

        // 3️⃣ Get watchlist users
        const watchlistItems = await Watchlist.find({
          animeId,
        }).populate({
          path: "user",
          select: "_id notificationIgnore",
        });

        if (!watchlistItems.length) {
          logger.info("No users watching this anime", { animeId });
          // No users → mark as done
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
            animeTitle: item.animeTitle,
            animeImage: item.animeImage,
            episode,
            episodeId,
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

        // 4️⃣ Mark as notified
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

import Notification from "../models/Notification.js";
import Watchlist from "../models/Watchlist.js";
import ScheduledEpisode from "../models/ScheduledEpisode.js";
import { fetchEpisodesCount } from "../utils/apiClient.js";

export const generateEpisodeNotifications = async () => {
  try {
    console.log("🔔 Checking pending scheduled episodes...");

    const pendingEpisodes = await ScheduledEpisode.find({
      isNotified: false,
    });

    if (!pendingEpisodes.length) {
      console.log("No pending episodes.");
      return;
    }

    for (const scheduled of pendingEpisodes) {
      const { animeId, episode } = scheduled;

      try {
        // 1️⃣ Fetch episode list
        const { episodes } = await fetchEpisodesCount(animeId);

        if (!episodes || !episodes.length) {
          console.log(`No episodes found for ${animeId}`);
          continue;
        }

        // 2️⃣ Check if specific episode exists
        const episodeData = episodes.find((ep) => ep.number === episode);

        if (!episodeData) {
          console.log(`⏳ Episode ${episode} of ${animeId} not uploaded yet.`);
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

          console.log(
            `✅ Sent ${notifications.length} notifications for ${animeId}`,
          );
        }

        // 4️⃣ Mark as notified
        scheduled.isNotified = true;
        await scheduled.save();
      } catch (error) {
        console.log(`❌ Error processing ${animeId}:`, error.message);
      }
    }

    console.log("✅ Notification job completed.");
  } catch (error) {
    console.error("❌ Notification job failed:", error.message);
  }
};

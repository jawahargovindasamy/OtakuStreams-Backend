import Notification from "../models/Notification.js";
import Watchlist from "../models/Watchlist.js";
import User from "../models/User.js";
import { fetchNextEpisode } from "../utils/apiClient.js";

export const generateEpisodeNotifications = async () => {
  const users = await User.find();

  for (const user of users) {
    const ignore = user.notificationIgnore || {};

    const watchlist = await Watchlist.find({ user: user._id });

    for (const anime of watchlist) {
      if (ignore[anime.status]) continue;

      const nextEpisode = await fetchNextEpisode(anime.animeId);
      if (!nextEpisode) continue;

      const airingTime = new Date(nextEpisode.airingISOTimestamp);

      const diff = airingTime - Date.now();
      const hours = diff / (1000 * 60 * 60);

      if (hours < 0 || hours > 24) continue;

      // Avoid duplicate notification
      const exists = await Notification.findOne({
        user: user._id,
        animeId: anime.animeId,
        airingTime,
      });

      if (exists) continue;

      await Notification.create({
        user: user._id,
        animeId: anime.animeId,
        animeTitle: anime.animeTitle,
        animeImage: anime.animeImage,
        message: `New episode of ${anime.animeTitle} airs soon!`,
        airingTime,
      });
    }
  }
};

import axios from "axios";

const BASE_URL =
  "https://aniwatch-bj2r.onrender.com/api/v2/hianime";

export const fetchScheduleByDate = async (dateStr) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/schedule?date=${dateStr}`
    );
    return res.data?.data?.scheduledAnimes || [];
  } catch (error) {
    console.error("Schedule API error:", error.message);
    return [];
  }
};

export const fetchEpisodesCount = async (animeId) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/anime/${animeId}/episodes`
    );

    return {
      totalEpisodes: res.data?.data?.totalEpisodes || 0,
      episodes: res.data?.data?.episodes || [],
    };
  } catch (error) {
    console.error("Episodes API error:", error.message);
    return { totalEpisodes: 0, episodes: [] };
  }
};
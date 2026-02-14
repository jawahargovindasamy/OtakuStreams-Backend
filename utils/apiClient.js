import axios from "axios";

export const fetchNextEpisode = async (animeId) => {
  try {
    const res = await axios.get(
      `https://aniwatch-bj2r.onrender.com/api/v2/hianime/anime/${animeId}/next-episode-schedule`,
    );

    return res.data?.data || null;
  } catch (error) {
    console.error("Episode API error:", err.message);
    return null;
  }
};

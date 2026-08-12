import axios from "axios";
import logger from "../utils/logger.js";

/**
 * Check if a specific episode of an anime is available on Megaplay.
 * 
 * @param {string} animeId - AniList Media ID
 * @param {string|null} malId - MyAnimeList ID
 * @param {number} episode - Episode number to check
 * @returns {Promise<boolean>} True if the episode is available, false otherwise.
 */
export const checkMegaplayAvailability = async (animeId, malId, episode) => {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Referer: "https://megaplay.buzz/",
  };

  const subPatterns = [
    `https://megaplay.buzz/stream/ani/${animeId}/${episode}/sub`,
  ];
  if (malId) {
    subPatterns.push(`https://megaplay.buzz/stream/mal/${malId}/${episode}/sub`);
  }

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
        return true;
      }
    } catch (error) {
      // Silently fail and try the next pattern
      logger.debug(`Availability check failed/timeout for URL: ${url}`, {
        message: error.message,
      });
    }
  }

  return false;
};

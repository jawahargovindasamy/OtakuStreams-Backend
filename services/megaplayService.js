import axios from "axios";
import logger from "../utils/logger.js";

/**
 * Check if a specific episode of an anime is available on Megaplay.
 * 
 * @param {string} animeId - AniList Media ID
 * @param {string|null} malId - MyAnimeList ID
 * @param {number} episode - Episode number to check
 * @returns {Promise<string>} 'AVAILABLE', 'NOT_FOUND', or 'VERIFICATION_FAILED'
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

  let hasVerificationFailure = false;

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
        return "AVAILABLE";
      } else {
        logger.debug(`Episode definitely not found (Oops page) for URL: ${url}`);
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          logger.debug(`Episode definitely not found (404) for URL: ${url}`);
        } else {
          logger.warn(`Megaplay returned security/server error (${status}) for URL: ${url}. Assuming verification failed.`);
          hasVerificationFailure = true;
        }
      } else {
        logger.warn(`Megaplay connection failed/timeout for URL: ${url}. Assuming verification failed.`, {
          message: error.message,
        });
        hasVerificationFailure = true;
      }
    }
  }

  return hasVerificationFailure ? "VERIFICATION_FAILED" : "NOT_FOUND";
};

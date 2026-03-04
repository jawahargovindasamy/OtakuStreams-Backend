import axios from "axios";
import { STATUS_CODES } from "../constants/statusCodes.js";

const BASE_URL = "https://aniwatch-bj2r.onrender.com/api/v2/hianime/category";

const RANDOM_ENDPOINTS = [
  "most-favorite",
  "most-popular",
  "subbed-anime",
  "dubbed-anime",
  "recently-updated",
  "recently-added",
  "top-airing",
  "movie",
  "special",
  "ova",
  "ona",
  "tv",
  "completed",
];

const MIN_PAGE = 1;
const MAX_PAGE = 20;

export const getRandomAnime = async (req, res) => {
  try {
    const randomEndpoint =
      RANDOM_ENDPOINTS[Math.floor(Math.random() * RANDOM_ENDPOINTS.length)];

    const randomPage =
      Math.floor(Math.random() * (MAX_PAGE - MIN_PAGE + 1)) + MIN_PAGE;

    const url = `${BASE_URL}/${randomEndpoint}?page=${randomPage}`;

    const response = await axios.get(url);

    const animes = response.data?.data?.animes || [];

    if (!animes.length) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "No anime found on random page",
      });
    }

    const randomAnime = animes[Math.floor(Math.random() * animes.length)];

    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      source: randomEndpoint,
      page: randomPage,
      data: {
        id: randomAnime.id,
        name: randomAnime.name,
        poster: randomAnime.poster,
        type: randomAnime.type,
      },
    });
  } catch (error) {
    console.error("Random Anime Error:", error.message);

    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch random anime",
    });
  }
};

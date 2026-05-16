import axios from "axios";
import { STATUS_CODES } from "../constants/statusCodes.js";

const ANILIST_URL = "https://graphql.anilist.co";

const query = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title {
          romaji
          english
        }
        coverImage {
          extraLarge
          large
        }
        type
        format
      }
    }
  }
`;

export const getRandomAnime = async (req, res) => {
  try {
    // Pick a random page between 1 and 10 to get variety from trending anime
    const randomPage = Math.floor(Math.random() * 10) + 1;
    const perPage = 20;

    const response = await axios.post(ANILIST_URL, {
      query,
      variables: {
        page: randomPage,
        perPage: perPage,
      },
    });

    const animes = response.data?.data?.Page?.media || [];

    if (!animes.length) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "No anime found on AniList",
      });
    }

    // Pick a random anime from the results
    const randomAnime = animes[Math.floor(Math.random() * animes.length)];

    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      source: "AniList",
      page: randomPage,
      data: {
        id: randomAnime.id.toString(),
        name: randomAnime.title.english || randomAnime.title.romaji,
        poster: randomAnime.coverImage.extraLarge || randomAnime.coverImage.large,
        type: randomAnime.format || randomAnime.type,
      },
    });
  } catch (error) {
    console.error("AniList Random Anime Error:", error.response?.data || error.message);

    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch random anime from AniList",
    });
  }
};

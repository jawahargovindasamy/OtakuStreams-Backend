import Watchlist, { WATCH_STATUS } from "../models/Watchlist.js";
import { STATUS_CODES } from "../constants/statusCodes.js";

// @desc    Add anime to watchlist
// @route   POST /api/watchlist
// @access  Private
export const addToWatchlist = async (req, res) => {
  try {
    const {
      animeId,
      animeTitle,
      animeImage,
      status = WATCH_STATUS.PLAN_TO_WATCH,
      rating,
      episodesWatched,
      totalEpisodes,
      notes,
    } = req.body;

    // Check if already in watchlist
    const exists = await Watchlist.findOne({
      user: req.user.id,
      animeId,
    });

    if (exists) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "Anime already in watchlist. Use update endpoint to modify.",
      });
    }

    const watchlistItem = await Watchlist.create({
      user: req.user.id,
      animeId,
      animeTitle,
      animeImage,
      status,
      rating,
      episodesWatched,
      totalEpisodes,
      notes,
    });

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      data: watchlistItem,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user.id };
    if (status && Object.values(WATCH_STATUS).includes(status)) {
      query.status = status;
    }

    const watchlist = await Watchlist.find(query).sort({ updatedAt: -1 });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get watchlist statistics
// @route   GET /api/watchlist/stats
// @access  Private
export const getWatchlistStats = async (req, res) => {
  try {
    const stats = await Watchlist.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    // Format stats
    const formattedStats = {
      total: 0,
      plan_to_watch: 0,
      watching: 0,
      on_hold: 0,
      completed: 0,
      dropped: 0,
      averageRating: 0,
    };

    let totalRating = 0;
    let ratedCount = 0;

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      if (stat.avgRating) {
        totalRating += stat.avgRating * stat.count;
        ratedCount += stat.count;
      }
    });

    if (ratedCount > 0) {
      formattedStats.averageRating = (totalRating / ratedCount).toFixed(2);
    }

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update watchlist item
// @route   PUT /api/watchlist/:id
// @access  Private
export const updateWatchlistItem = async (req, res) => {
  try {
    const { status, rating, episodesWatched, notes } = req.body;

    const watchlistItem = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!watchlistItem) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Watchlist item not found",
      });
    }

    if (status) watchlistItem.status = status;
    if (rating !== undefined) watchlistItem.rating = rating;
    if (episodesWatched !== undefined)
      watchlistItem.episodesWatched = episodesWatched;
    if (notes !== undefined) watchlistItem.notes = notes;

    await watchlistItem.save();

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: watchlistItem,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
export const removeFromWatchlist = async (req, res) => {
  try {
    const watchlistItem = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!watchlistItem) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Watchlist item not found",
      });
    }

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Removed from watchlist",
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if anime is in watchlist
// @route   GET /api/watchlist/check/:animeId
// @access  Private
export const checkWatchlistStatus = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      user: req.user.id,
      animeId: req.params.animeId,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: {
        inWatchlist: !!item,
        item: item || null,
      },
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

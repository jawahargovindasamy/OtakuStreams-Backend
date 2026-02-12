import ContinueWatching from "../models/ContinueWatching.js";
import { STATUS_CODES } from "../constants/statusCodes.js";

// @desc    Update or create continue watching entry
// @route   POST /api/continue-watching
// @access  Private
export const updateProgress = async (req, res) => {
  try {
    const {
      animeId,
      animeTitle,
      animeImage,
      currentEpisode,
      currentTime = 0,
      duration = 0,
      episodeTitle = "",
    } = req.body;

    // Use findOneAndUpdate with upsert to create or update
    const progress = await ContinueWatching.findOneAndUpdate(
      { user: req.user.id, animeId },
      {
        user: req.user.id,
        animeId,
        animeTitle,
        animeImage,
        currentEpisode,
        currentTime,
        duration,
        episodeTitle,
        lastWatched: Date.now(),
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true,
      },
    );

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all continue watching entries
// @route   GET /api/continue-watching
// @access  Private
export const getContinueWatching = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const entries = await ContinueWatching.find({ user: req.user.id })
      .sort({ lastWatched: -1 })
      .limit(Number(limit));

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get specific anime progress
// @route   GET /api/continue-watching/:animeId
// @access  Private
export const getAnimeProgress = async (req, res) => {
  try {
    const progress = await ContinueWatching.findOne({
      user: req.user.id,
      animeId: req.params.animeId,
    });

    if (!progress) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "No progress found for this anime",
      });
    }

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete continue watching entry
// @route   DELETE /api/continue-watching/:animeId
// @access  Private
export const deleteProgress = async (req, res) => {
  try {
    const result = await ContinueWatching.findOneAndDelete({
      user: req.user.id,
      animeId: req.params.animeId,
    });

    if (!result) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Progress not found",
      });
    }

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Progress deleted successfully",
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Clear all continue watching history
// @route   DELETE /api/continue-watching
// @access  Private
export const clearAllProgress = async (req, res) => {
  try {
    await ContinueWatching.deleteMany({ user: req.user.id });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "All watch history cleared",
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

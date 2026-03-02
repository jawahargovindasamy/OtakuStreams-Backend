import ContinueWatching from "../models/ContinueWatching.js";
import { STATUS_CODES } from "../constants/statusCodes.js";
import logger from "../utils/logger.js";

// @desc    Update or create continue watching entry
// @route   POST /api/continue-watching
// @access  Private
export const updateProgress = async (req, res) => {
  try {
    const {
      animeId,
      episodeId,
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
        episodeId,
        animeTitle,
        animeImage,
        currentEpisode,
        currentTime,
        duration,
        episodeTitle,
        lastWatched: Date.now(),
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      },
    );

    logger.info("Continue watching updated", {
      userId: req.user.id,
      animeId,
      episodeId,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error("Update progress failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

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

    logger.info("Fetched continue watching list", {
      userId: req.user.id,
      count: entries.length,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    logger.error("Fetch continue watching failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

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
      logger.warn("Anime progress not found", {
        userId: req.user.id,
        animeId: req.params.animeId,
      });

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
    logger.error("Fetch anime progress failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

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
      logger.warn("Delete progress failed - not found", {
        userId: req.user.id,
        animeId: req.params.animeId,
      });

      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Progress not found",
      });
    }

    logger.info("Progress deleted", {
      userId: req.user.id,
      animeId: req.params.animeId,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Progress deleted successfully",
    });
  } catch (error) {
    logger.error("Delete progress failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

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

    logger.info("All continue watching cleared", {
      userId: req.user.id,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "All watch history cleared",
    });
  } catch (error) {
    logger.error("Clear all progress failed", {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

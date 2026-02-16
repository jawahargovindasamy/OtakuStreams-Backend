import mongoose from "mongoose";

const continueWatchingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    animeId: {
      type: String,
      required: [true, "Anime ID is required"],
    },
    episodeId: {
      type: String,
      required: [true, "Episode ID is required"],
    },
    animeTitle: {
      type: String,
      required: [true, "Anime title is required"],
    },
    animeImage: {
      type: String,
      default: "",
    },
    currentEpisode: {
      type: Number,
      required: [true, "Current episode is required"],
      min: 1,
    },
    currentTime: {
      type: Number, // Time in seconds
      default: 0,
      min: 0,
    },
    duration: {
      type: Number, // Total duration in seconds
      default: 0,
      min: 0,
    },
    episodeTitle: {
      type: String,
      default: "",
    },
    lastWatched: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one entry per anime per user
continueWatchingSchema.index({ user: 1, animeId: 1 }, { unique: true });

// Index for sorting by last watched
continueWatchingSchema.index({ user: 1, lastWatched: -1 });

const ContinueWatching = mongoose.model(
  "ContinueWatching",
  continueWatchingSchema,
);
export default ContinueWatching;

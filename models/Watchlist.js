import mongoose from "mongoose";

export const WATCH_STATUS = {
  PLAN_TO_WATCH: "plan_to_watch",
  WATCHING: "watching",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  DROPPED: "dropped",
};

const watchlistSchema = new mongoose.Schema(
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
    animeTitle: {
      type: String,
      required: [true, "Anime title is required"],
    },
    animeImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(WATCH_STATUS),
      default: WATCH_STATUS.PLAN_TO_WATCH,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    episodesWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEpisodes: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate entries
watchlistSchema.index({ user: 1, animeId: 1 }, { unique: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
export default Watchlist;

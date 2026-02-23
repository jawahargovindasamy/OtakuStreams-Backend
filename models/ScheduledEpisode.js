import mongoose from "mongoose";

const scheduledEpisodeSchema = new mongoose.Schema(
  {
    animeId: {
      type: String,
      required: true,
      index: true,
    },
    animeTitle: {
      type: String,
    },
    episode: {
      type: Number,
      required: true,
    },
    airingTimestamp: {
      type: Number,
      required: true,
    },
    airingDate: {
      type: String,
      required: true,
    },
    isNotified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicates
scheduledEpisodeSchema.index(
  { animeId: 1, episode: 1 },
  { unique: true }
);

export default mongoose.model("ScheduledEpisode", scheduledEpisodeSchema);
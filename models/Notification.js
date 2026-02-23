import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    animeId: String,
    animeTitle: String,
    animeImage: String,

    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["NEXT_EPISODE"],
      default: "NEXT_EPISODE",
    },
    read: {
      type: Boolean,
      default: false,
    },
    episode: {
      type: Number,
      required: true,
    },
    episodeId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, animeId: 1, episode: 1 }, { unique: true });

export default mongoose.model("Notification", notificationSchema);

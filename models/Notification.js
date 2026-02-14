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

    airingTime: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);

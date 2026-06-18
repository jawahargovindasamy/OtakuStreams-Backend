import mongoose from "mongoose";

const appVersionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["android", "ios"],
      required: [true, "Platform is required"],
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      required: [true, "Environment is required"],
    },
    channel: {
      type: String,
      enum: ["internal", "beta", "stable"],
      default: "stable",
      required: [true, "Channel is required"],
    },
    versionName: {
      type: String,
      required: [true, "Version name is required"],
      trim: true,
    },
    versionCode: {
      type: Number,
      required: [true, "Version code is required"],
    },
    artifact: {
      name: {
        type: String,
        required: [true, "Artifact name is required"],
        trim: true,
      },
      url: {
        type: String,
        required: [true, "Artifact download URL is required"],
        trim: true,
      },
      sha256: {
        type: String,
        required: [true, "Artifact SHA256 is required"],
        trim: true,
      },
      size: {
        type: Number,
        required: [true, "Artifact size is required"],
      },
    },
    minSupportedVersionCode: {
      type: Number,
      required: [true, "Minimum supported version code is required"],
    },
    forceUpdate: {
      type: Boolean,
      default: false,
    },
    rolloutPercentage: {
      type: Number,
      default: 100,
      min: [0, "Rollout percentage cannot be less than 0"],
      max: [100, "Rollout percentage cannot exceed 100"],
    },
    releaseNotes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "active", "recalled"],
      default: "active",
      required: true,
    },
    releasedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index for idempotence
appVersionSchema.index(
  { platform: 1, versionCode: 1, environment: 1, channel: 1 },
  { unique: true }
);

// Strict lifecycle state transition logic
appVersionSchema.pre("save", async function () {
  if (this.isNew) {
    return;
  }

  // Handle status transition checks
  if (this.isModified("status")) {
    const original = await this.constructor.findById(this._id);
    if (original) {
      const oldStatus = original.status;
      const newStatus = this.status;

      if (oldStatus === "recalled") {
        throw new Error("Cannot change status of a recalled version.");
      }

      if (oldStatus === "active" && newStatus === "draft") {
        throw new Error("Cannot transition active version back to draft.");
      }
    }
  }
});

const AppVersion = mongoose.model("AppVersion", appVersionSchema);
export default AppVersion;

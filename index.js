import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import continueWatchingRoutes from "./routes/continueWatchingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import randomRoutes from "./routes/randomRoutes.js";
import { startEpisodeJob } from "./jobs/episodeNotificationJob.js";
import { startScheduleJob } from "./jobs/scheduleJob.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

startEpisodeJob();
startScheduleJob();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------------------------
   Morgan → Winston Integration
--------------------------------------------------- */

const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev", { stream }));
} else {
  app.use(
    morgan("combined", {
      stream,
    }),
  );
}

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check hit", { ip: req.ip });
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/continue-watching", continueWatchingRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/random", randomRoutes);

app.get("/", (req, res) => {
  res.send("Otakustreams API running 🚀");
});

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info("Server started", {
    port: PORT,
    environment: process.env.NODE_ENV,
  });

  // Start keep-alive ping after server starts (only in production)
  // if (process.env.NODE_ENV === "production") {
  //   startKeepAlive();
  // }
});

// Keep-alive function to prevent Render sleep
// const startKeepAlive = () => {
//   // Use SELF_PING_URL for local or RENDER_EXTERNAL_URL for production
//   const PING_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL;

//   if (!PING_URL) {
//     logger.warn("Keep-alive not started - No ping URL provided");
//     return;
//   }

//   logger.info("Keep-alive started", {
//     url: `${PING_URL}/health`,
//     interval: "8 minutes",
//   });

//   const PING_INTERVAL = 8 * 60 * 1000; // 8 minutes

//   setInterval(async () => {
//     try {
//       await fetch(`${PING_URL}/health`);
//       logger.info("Keep-alive ping successful");
//     } catch (err) {
//       logger.error("Keep-alive ping failed", {
//         message: err.message,
//       });
//     }
//   }, PING_INTERVAL);
// };

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", {
    message: err.message,
    stack: err.stack,
  });

  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
  });

  process.exit(1);
});

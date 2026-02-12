import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import continueWatchingRoutes from "./routes/continueWatchingRoutes.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Start keep-alive ping after server starts (only in production)
  if (process.env.NODE_ENV === "production") {
    startKeepAlive();
  }
});

// Keep-alive function to prevent Render sleep
const startKeepAlive = () => {
  const RENDER_URL =
    process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL;
  if (!RENDER_URL) {
    console.log(
      "⚠️  No RENDER_EXTERNAL_URL or SELF_PING_URL set. Keep-alive not started.",
    );
    return;
  }

  console.log(`🔄 Keep-alive started. Pinging: ${RENDER_URL}/health`);

  // Ping every 10 minutes (600,000 ms)
  const PING_INTERVAL = 10 * 60 * 1000;

  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_URL}/health`);
      const data = await response.json();
      console.log(`✅ Keep-alive ping successful: ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`❌ Keep-alive ping failed: ${error.message}`);
    }
  }, PING_INTERVAL);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

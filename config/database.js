import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info("MongoDB connected successfully", {
      host: conn.connection.host,
      name: conn.connection.name,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    logger.error("MongoDB connection failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error", {
    message: err.message,
  });
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from DB");
});

// Optional: Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed due to app termination");
  process.exit(0);
});

export default connectDB;

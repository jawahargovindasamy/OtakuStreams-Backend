import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

/* ---------------------------------------------------
   Ensure Logs Directory Exists
--------------------------------------------------- */

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/* ---------------------------------------------------
   Base Format (timestamp + stack)
--------------------------------------------------- */

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true })
);

/* ---------------------------------------------------
   Development Format (Readable + Metadata)
--------------------------------------------------- */

const devFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0
        ? ` ${JSON.stringify(meta, null, 2)}`
        : "";

    return stack
      ? `${timestamp} [${level}]: ${message}${metaString}\n${stack}`
      : `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

/* ---------------------------------------------------
   Production Format (Structured JSON)
--------------------------------------------------- */

const prodFormat = winston.format.combine(
  baseFormat,
  winston.format.json()
);

/* ---------------------------------------------------
   Logger Instance
--------------------------------------------------- */

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: isProduction ? prodFormat : devFormat,
  transports: [
    // Console Transport
    new winston.transports.Console({
      level: isProduction ? "info" : "debug",
    }),

    // Daily Rotated Combined Logs
    new DailyRotateFile({
      filename: path.join(logDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
      level: "info",
    }),

    // Daily Rotated Error Logs
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "30d",
      zippedArchive: true,
      level: "error",
    }),
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, "exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "30d",
      zippedArchive: true,
    }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, "rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "30d",
      zippedArchive: true,
    }),
  ],

  exitOnError: false,
});

export default logger;
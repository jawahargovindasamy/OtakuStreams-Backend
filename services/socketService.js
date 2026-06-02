import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

let io = null;

/**
 * Initialize Socket.io on the provided HTTP server.
 * @param {import("http").Server} server - The HTTP server instance.
 * @returns {Server} The initialized Socket.io instance.
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust origins if required in production
      methods: ["GET", "POST"],
    },
  });

  // Explicit JWT verification middleware at handshake level
  io.use((socket, next) => {
    let token = null;

    // Retrieve token based on priority order:
    // 1. socket.handshake.auth.token
    // 2. socket.handshake.headers.authorization
    // 3. socket.handshake.headers.token (for easy testing in Postman)
    // 4. socket.handshake.query.token
    if (socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    } else if (socket.handshake.headers?.authorization) {
      token = socket.handshake.headers.authorization;
    } else if (socket.handshake.headers?.token) {
      token = socket.handshake.headers.token;
    } else if (socket.handshake.query?.token) {
      token = socket.handshake.query.token;
    }

    if (!token || token === "null" || token === "undefined" || token === "[object Object]") {
      logger.warn("Socket connection rejected: No authentication token provided", {
        socketId: socket.id,
      });
      return next(new Error("Authentication error: Token required"));
    }

    // Handle Bearer <token> format
    if (typeof token === "string" && token.startsWith("Bearer ") && token.length > 7) {
      token = token.slice(7).trim();
    }

    if (!token || token === "null" || token === "undefined" || token === "[object Object]") {
      logger.warn("Socket connection rejected: No authentication token provided", {
        socketId: socket.id,
      });
      return next(new Error("Authentication error: Token required"));
    }

    try {
      // Decode and verify the token using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return next(new Error("Authentication error: Invalid token payload"));
      }

      socket.userId = decoded.id.toString();
      next();
    } catch (error) {
      logger.warn("Socket connection rejected: Invalid or expired token", {
        socketId: socket.id,
        error: error.message,
      });
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // Connection Handler
  io.on("connection", (socket) => {
    const userId = socket.userId;
    
    // Join a room named after the user's ID
    socket.join(userId);
    
    logger.info("Socket client authenticated and connected", {
      socketId: socket.id,
      userId,
    });

    socket.on("disconnect", (reason) => {
      logger.info("Socket client disconnected", {
        socketId: socket.id,
        userId,
        reason,
      });
    });
  });

  return io;
};

/**
 * Getter to retrieve the active Socket.io instance safely.
 * @returns {Server}
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

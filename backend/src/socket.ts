import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "./middleware/auth.middleware";

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

let io: SocketIOServer | null = null;

export const initSocketIO = (server: HTTPServer): SocketIOServer => {
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT authentication middleware for Socket.IO connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // JWT_SECRET is guaranteed to exist — startup validation in index.ts ensures this
    const jwtSecret = process.env.JWT_SECRET!;

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    if (socket.user) {
      const roomName = `user:${socket.user.id}`;
      socket.join(roomName);
    }

    socket.on("disconnect", () => {
      // Connection closed — no sensitive data logged
    });
  });

  return io;
};

/**
 * Emits a Socket.IO event to a specific user's private room.
 * Safe to call even if Socket.IO is not yet initialized.
 */
export const emitUserEvent = (userId: string, eventName: string, payload: Record<string, unknown>): void => {
  if (io) {
    io.to(`user:${userId}`).emit(eventName, payload);
  }
};

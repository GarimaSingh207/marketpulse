import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "./middleware/auth.middleware";

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

let io: SocketIOServer | null = null;

export const initSocketIO = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // JWT Middleware for Socket.IO authentication
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const jwtSecret = process.env.JWT_SECRET || "default_secret";

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    if (socket.user) {
      const roomName = `user:${socket.user.id}`;
      socket.join(roomName);
      console.log(`Socket connected: ${socket.id} joined room ${roomName}`);
    }

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }
  return io;
};

export const emitUserEvent = (userId: string, eventName: string, payload: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(eventName, payload);
  }
};

import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { initSocketIO } from "./socket";

// ─── Required environment variable check ────────────────────────────────────
const REQUIRED_ENV_VARS = ["JWT_SECRET", "DATABASE_URL", "MARKET_API_KEY"];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO with HTTP server instance
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || "development"}`);
});

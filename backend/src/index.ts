import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { initSocketIO } from "./socket";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO with HTTP server instance
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

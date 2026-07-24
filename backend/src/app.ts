import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import dbCheckRoutes from "./routes/dbCheck.routes";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/db-check", dbCheckRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

export default app;

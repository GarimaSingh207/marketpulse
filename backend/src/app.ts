import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import dbCheckRoutes from "./routes/dbCheck.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/db-check", dbCheckRoutes);

export default app;

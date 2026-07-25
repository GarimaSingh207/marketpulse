import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import healthRoutes from "./routes/health.routes";
import dbCheckRoutes from "./routes/dbCheck.routes";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import adminRoutes from "./routes/admin.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import holdingRoutes from "./routes/holding.routes";
import marketRoutes from "./routes/market.routes";
import watchlistRoutes from "./routes/watchlist.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Global API rate limiter — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/db-check", dbCheckRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/watchlists", watchlistRoutes);

export default app;

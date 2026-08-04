import express, { Request, Response, NextFunction } from "express";
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

// Trust reverse proxy (Nginx) for accurate client IP detection in rate limiters
app.set("trust proxy", 1);

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(helmet());

// CORS: allow configured origins in production, any localhost in development
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow the configured origin(s)
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development also allow any localhost port
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS: origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── Rate limiters ───────────────────────────────────────────────────────────

// General API limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Auth limiter: 20 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/db-check", dbCheckRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/watchlists", watchlistRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Centralized error handler ────────────────────────────────────────────────
// Must have 4 parameters so Express recognizes it as an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const isDev = process.env.NODE_ENV !== "production";
  
  // Detailed diagnostic logging for unhandled errors
  console.error("=================== BACKEND EXCEPTION ===================");
  console.error(`Timestamp: ${new Date().toISOString()}`);
  console.error(`Method:    ${req.method}`);
  console.error(`Path:      ${req.path}`);
  console.error(`Message:   ${err.message}`);
  console.error(`Stack:\n${err.stack || "No stack trace available"}`);
  console.error("=========================================================");

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(isDev && { errorCode: err.message }),
  });
});

export default app;

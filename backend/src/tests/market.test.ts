import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Mocks (must come before app import) ─────────────────────────────────────
vi.mock("../lib/prisma", () => import("./mocks/prisma.mock"));
vi.mock("../lib/redis", () => import("./mocks/redis.mock"));
vi.mock("../socket", () => import("./mocks/socket.mock"));
vi.mock("../services/market.service", () => ({
  fetchStockPrice: vi.fn().mockResolvedValue({ symbol: "AAPL", currentPrice: 175.25 }),
}));

import app from "../app";
import { fetchStockPrice } from "../services/market.service";

const mockFetchStockPrice = fetchStockPrice as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeToken = () =>
  jwt.sign(
    { id: "user-001", email: "test@example.com", role: "USER" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

const authHeader = () => ({ Authorization: `Bearer ${makeToken()}` });

// ─── Market Price Endpoint ────────────────────────────────────────────────────
describe("GET /api/market/price/:symbol", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a stock quote for a valid symbol", async () => {
    mockFetchStockPrice.mockResolvedValue({ symbol: "AAPL", currentPrice: 175.25 });

    const res = await request(app)
      .get("/api/market/price/AAPL")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe("AAPL");
    expect(typeof res.body.currentPrice).toBe("number");
    expect(res.body.currentPrice).toBeGreaterThan(0);
  });

  it("returns a quote for lowercase symbol (service normalises to uppercase)", async () => {
    mockFetchStockPrice.mockResolvedValue({ symbol: "TSLA", currentPrice: 250.0 });

    const res = await request(app)
      .get("/api/market/price/tsla")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe("TSLA");
  });

  it("returns 400 for an invalid ticker format from the service", async () => {
    mockFetchStockPrice.mockRejectedValue({
      status: 400,
      message: "Invalid ticker symbol format",
    });

    const res = await request(app)
      .get("/api/market/price/!!INVALID!!")
      .set(authHeader());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("returns 503 when the market service is unavailable", async () => {
    mockFetchStockPrice.mockRejectedValue({
      status: 503,
      message: "Market data temporarily unavailable",
    });

    const res = await request(app)
      .get("/api/market/price/AAPL")
      .set(authHeader());

    expect(res.status).toBe(503);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/market/price/AAPL");
    expect(res.status).toBe(401);
  });
});

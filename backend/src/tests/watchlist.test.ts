import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Mocks (must come before app import) ─────────────────────────────────────
vi.mock("../lib/prisma", () => import("./mocks/prisma.mock"));
vi.mock("../lib/redis", () => import("./mocks/redis.mock"));
vi.mock("../socket", () => import("./mocks/socket.mock"));
// Also mock the market service to prevent real Finnhub calls in watchlist tests
vi.mock("../services/market.service", () => ({
  fetchStockPrice: vi.fn().mockResolvedValue({ symbol: "AAPL", currentPrice: 175.25 }),
}));

import app from "../app";
import prisma from "../lib/prisma";

const mockPrisma = prisma as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeToken = () =>
  jwt.sign(
    { id: "user-001", email: "test@example.com", role: "USER" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

const authHeader = () => ({ Authorization: `Bearer ${makeToken()}` });

const mockWatchlist = (overrides = {}) => ({
  id: "watchlist-001",
  name: "My Watchlist",
  userId: "user-001",
  stocks: [],
  ...overrides,
});

const mockStock = (overrides = {}) => ({
  id: "stock-001",
  watchlistId: "watchlist-001",
  symbol: "AAPL",
  ...overrides,
});

// ─── Create Watchlist ─────────────────────────────────────────────────────────
describe("POST /api/watchlists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a watchlist and returns 201", async () => {
    mockPrisma.watchlist.create.mockResolvedValue(mockWatchlist());

    const res = await request(app)
      .post("/api/watchlists")
      .set(authHeader())
      .send({ name: "My Watchlist" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Watchlist");
    expect(res.body.userId).toBe("user-001");
  });

  it("returns 400 for validation error — empty name", async () => {
    const res = await request(app)
      .post("/api/watchlists")
      .set(authHeader())
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/watchlists")
      .send({ name: "My Watchlist" });

    expect(res.status).toBe(401);
  });
});

// ─── Get Watchlists ───────────────────────────────────────────────────────────
describe("GET /api/watchlists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of watchlists with 200", async () => {
    mockPrisma.watchlist.findMany.mockResolvedValue([
      mockWatchlist(),
      mockWatchlist({ id: "watchlist-002", name: "Tech Stocks" }),
    ]);

    const res = await request(app).get("/api/watchlists").set(authHeader());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("returns empty array when no watchlists", async () => {
    mockPrisma.watchlist.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/watchlists").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/watchlists");
    expect(res.status).toBe(401);
  });
});

// ─── Get Watchlist By ID ──────────────────────────────────────────────────────
describe("GET /api/watchlists/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns watchlist with stock prices when found", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(
      mockWatchlist({ stocks: [mockStock()] })
    );

    const res = await request(app)
      .get("/api/watchlists/watchlist-001")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("watchlist-001");
    expect(Array.isArray(res.body.stocks)).toBe(true);
    // Live price fetched via mocked market service
    expect(res.body.stocks[0].currentPrice).toBeDefined();
  });

  it("returns 404 when watchlist not found", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/watchlists/nonexistent")
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/watchlists/watchlist-001");
    expect(res.status).toBe(401);
  });
});

// ─── Delete Watchlist ─────────────────────────────────────────────────────────
describe("DELETE /api/watchlists/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a watchlist and returns 200", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());
    mockPrisma.watchlist.delete.mockResolvedValue(mockWatchlist());

    const res = await request(app)
      .delete("/api/watchlists/watchlist-001")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("returns 404 when watchlist does not exist", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/watchlists/nonexistent")
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/watchlists/watchlist-001");
    expect(res.status).toBe(401);
  });
});

// ─── Add Stock to Watchlist ───────────────────────────────────────────────────
describe("POST /api/watchlists/:id/stocks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a stock and returns 201", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());
    mockPrisma.watchlistStock.findFirst.mockResolvedValue(null); // not a duplicate
    mockPrisma.watchlistStock.create.mockResolvedValue(mockStock());

    const res = await request(app)
      .post("/api/watchlists/watchlist-001/stocks")
      .set(authHeader())
      .send({ symbol: "AAPL" });

    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe("AAPL");
  });

  it("returns 409 when symbol is already in the watchlist", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());
    mockPrisma.watchlistStock.findFirst.mockResolvedValue(mockStock()); // duplicate!

    const res = await request(app)
      .post("/api/watchlists/watchlist-001/stocks")
      .set(authHeader())
      .send({ symbol: "AAPL" });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
  });

  it("returns 400 for validation error — empty symbol", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());

    const res = await request(app)
      .post("/api/watchlists/watchlist-001/stocks")
      .set(authHeader())
      .send({ symbol: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/watchlists/watchlist-001/stocks")
      .send({ symbol: "AAPL" });

    expect(res.status).toBe(401);
  });
});

// ─── Remove Stock from Watchlist ──────────────────────────────────────────────
describe("DELETE /api/watchlists/:id/stocks/:symbol", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes a stock and returns 200", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());
    mockPrisma.watchlistStock.findFirst.mockResolvedValue(mockStock());
    mockPrisma.watchlistStock.delete.mockResolvedValue(mockStock());

    const res = await request(app)
      .delete("/api/watchlists/watchlist-001/stocks/AAPL")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it("returns 404 when stock is not in the watchlist", async () => {
    mockPrisma.watchlist.findFirst.mockResolvedValue(mockWatchlist());
    mockPrisma.watchlistStock.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/watchlists/watchlist-001/stocks/TSLA")
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/watchlists/watchlist-001/stocks/AAPL");
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Mocks (must come before app import) ─────────────────────────────────────
vi.mock("../lib/prisma", () => import("./mocks/prisma.mock"));
vi.mock("../lib/redis", () => import("./mocks/redis.mock"));
vi.mock("../socket", () => import("./mocks/socket.mock"));

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

const mockPortfolio = () => ({
  id: "portfolio-001",
  name: "My Portfolio",
  userId: "user-001",
  holdings: [],
});

const mockHolding = (overrides = {}) => ({
  id: "holding-001",
  portfolioId: "portfolio-001",
  symbol: "AAPL",
  quantity: 10,
  averagePrice: "150.00",
  portfolio: mockPortfolio(),
  ...overrides,
});

// ─── Add Holding ──────────────────────────────────────────────────────────────
describe("POST /api/portfolios/:portfolioId/holdings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a holding and returns 201", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(mockPortfolio());
    mockPrisma.holding.create.mockResolvedValue(mockHolding());

    const res = await request(app)
      .post("/api/portfolios/portfolio-001/holdings")
      .set(authHeader())
      .send({ symbol: "AAPL", quantity: 10, averagePrice: 150 });

    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe("AAPL");
    expect(res.body.portfolioId).toBe("portfolio-001");
  });

  it("returns 404 when portfolio does not belong to user", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/portfolios/portfolio-001/holdings")
      .set(authHeader())
      .send({ symbol: "AAPL", quantity: 10, averagePrice: 150 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 400 for validation error — missing symbol", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(mockPortfolio());

    const res = await request(app)
      .post("/api/portfolios/portfolio-001/holdings")
      .set(authHeader())
      .send({ quantity: 10, averagePrice: 150 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });

  it("returns 400 for validation error — negative quantity", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(mockPortfolio());

    const res = await request(app)
      .post("/api/portfolios/portfolio-001/holdings")
      .set(authHeader())
      .send({ symbol: "AAPL", quantity: -5, averagePrice: 150 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/portfolios/portfolio-001/holdings")
      .send({ symbol: "AAPL", quantity: 10, averagePrice: 150 });

    expect(res.status).toBe(401);
  });
});

// ─── Delete Holding ───────────────────────────────────────────────────────────
describe("DELETE /api/holdings/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an existing holding and returns 200", async () => {
    mockPrisma.holding.findFirst.mockResolvedValue(mockHolding());
    mockPrisma.holding.delete.mockResolvedValue(mockHolding());

    const res = await request(app)
      .delete("/api/holdings/holding-001")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("returns 404 when holding does not exist or belongs to another user", async () => {
    mockPrisma.holding.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/holdings/nonexistent-holding")
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 404 when holding belongs to another user's portfolio", async () => {
    mockPrisma.holding.findFirst.mockResolvedValue(
      mockHolding({ portfolio: { ...mockPortfolio(), userId: "other-user-999" } })
    );

    const res = await request(app)
      .delete("/api/holdings/holding-001")
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/holdings/holding-001");
    expect(res.status).toBe(401);
  });
});

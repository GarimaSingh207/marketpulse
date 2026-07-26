import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

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
});

const mockHolding = (overrides = {}) => ({
  id: "holding-001",
  portfolioId: "portfolio-001",
  symbol: "AAPL",
  quantity: 10,
  averagePrice: new Prisma.Decimal("150.00"),
  portfolio: mockPortfolio(),
  ...overrides,
});

const mockTransaction = (overrides = {}) => ({
  id: "tx-001",
  holdingId: "holding-001",
  type: "BUY",
  quantity: 5,
  price: new Prisma.Decimal("160.00"),
  createdAt: new Date(),
  ...overrides,
});

// ─── Create Transaction — BUY ─────────────────────────────────────────────────
describe("POST /api/holdings/:holdingId/transactions — BUY", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a BUY transaction and returns 201", async () => {
    const holding = mockHolding({ quantity: 10, averagePrice: new Prisma.Decimal("150.00") });
    const updatedHolding = mockHolding({ quantity: 15, averagePrice: new Prisma.Decimal("153.33") });

    mockPrisma.holding.findFirst.mockResolvedValue(holding);
    mockPrisma.$transaction.mockResolvedValue([mockTransaction(), updatedHolding]);

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "BUY", quantity: 5, price: 160 });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.holding).toBeDefined();
  });

  it("creates a SELL transaction and returns 201", async () => {
    const holding = mockHolding({ quantity: 10, averagePrice: new Prisma.Decimal("150.00") });
    const updatedHolding = mockHolding({ quantity: 5, averagePrice: new Prisma.Decimal("150.00") });

    mockPrisma.holding.findFirst.mockResolvedValue(holding);
    mockPrisma.$transaction.mockResolvedValue([
      mockTransaction({ type: "SELL" }),
      updatedHolding,
    ]);

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "SELL", quantity: 5, price: 170 });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
  });

  it("returns 400 when selling more than available quantity", async () => {
    const holding = mockHolding({ quantity: 3 });
    mockPrisma.holding.findFirst.mockResolvedValue(holding);

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "SELL", quantity: 10, price: 150 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot sell/i);
  });

  it("returns 404 when holding does not exist", async () => {
    mockPrisma.holding.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/holdings/nonexistent-holding/transactions")
      .set(authHeader())
      .send({ type: "BUY", quantity: 5, price: 160 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 400 for validation error — invalid transaction type", async () => {
    const holding = mockHolding();
    mockPrisma.holding.findFirst.mockResolvedValue(holding);

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "HOLD", quantity: 5, price: 160 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });

  it("returns 400 for validation error — missing price", async () => {
    const holding = mockHolding();
    mockPrisma.holding.findFirst.mockResolvedValue(holding);

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "BUY", quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .send({ type: "BUY", quantity: 5, price: 160 });

    expect(res.status).toBe(401);
  });

  it("returns 404 when holding belongs to another user", async () => {
    mockPrisma.holding.findFirst.mockResolvedValue(
      mockHolding({ portfolio: { ...mockPortfolio(), userId: "other-user-999" } })
    );

    const res = await request(app)
      .post("/api/holdings/holding-001/transactions")
      .set(authHeader())
      .send({ type: "BUY", quantity: 5, price: 160 });

    expect(res.status).toBe(404);
  });
});

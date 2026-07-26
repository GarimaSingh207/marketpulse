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
const makeToken = (payload = {}) =>
  jwt.sign(
    { id: "user-001", email: "test@example.com", role: "USER", ...payload },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

const authHeader = () => ({ Authorization: `Bearer ${makeToken()}` });

const mockPortfolio = (overrides = {}) => ({
  id: "portfolio-001",
  name: "My Portfolio",
  userId: "user-001",
  holdings: [],
  ...overrides,
});

// ─── Create Portfolio ─────────────────────────────────────────────────────────
describe("POST /api/portfolios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a portfolio and returns 201", async () => {
    mockPrisma.portfolio.create.mockResolvedValue(mockPortfolio());

    const res = await request(app)
      .post("/api/portfolios")
      .set(authHeader())
      .send({ name: "My Portfolio" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Portfolio");
    expect(res.body.userId).toBe("user-001");
  });

  it("returns 400 for missing portfolio name", async () => {
    const res = await request(app)
      .post("/api/portfolios")
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });

  it("returns 400 for empty portfolio name", async () => {
    const res = await request(app)
      .post("/api/portfolios")
      .set(authHeader())
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/portfolios")
      .send({ name: "Unauthorized Portfolio" });

    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.portfolio.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/portfolios")
      .set(authHeader())
      .send({ name: "Failing Portfolio" });

    expect(res.status).toBe(500);
  });
});

// ─── Get Portfolios ───────────────────────────────────────────────────────────
describe("GET /api/portfolios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a list of portfolios with 200", async () => {
    mockPrisma.portfolio.findMany.mockResolvedValue([
      mockPortfolio(),
      mockPortfolio({ id: "portfolio-002", name: "Second Portfolio" }),
    ]);

    const res = await request(app)
      .get("/api/portfolios")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("My Portfolio");
  });

  it("returns an empty array when no portfolios exist", async () => {
    mockPrisma.portfolio.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/portfolios")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/portfolios");
    expect(res.status).toBe(401);
  });
});

// ─── Delete Portfolio ─────────────────────────────────────────────────────────
describe("DELETE /api/portfolios/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an existing portfolio and returns 200", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(mockPortfolio());
    mockPrisma.portfolio.delete.mockResolvedValue(mockPortfolio());

    const res = await request(app)
      .delete("/api/portfolios/portfolio-001")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("returns 404 when portfolio does not exist", async () => {
    mockPrisma.portfolio.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/portfolios/nonexistent-id")
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/portfolios/portfolio-001");
    expect(res.status).toBe(401);
  });
});

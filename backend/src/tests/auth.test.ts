import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ─── Mocks (must come before app import) ─────────────────────────────────────
vi.mock("../lib/prisma", () => import("./mocks/prisma.mock"));
vi.mock("../lib/redis", () => import("./mocks/redis.mock"));
vi.mock("../socket", () => import("./mocks/socket.mock"));

import app from "../app";
import prisma from "../lib/prisma";

const mockPrisma = prisma as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = (overrides = {}) => ({
  id: "user-001",
  name: "Test User",
  email: "test@example.com",
  password: "$2b$10$hashedpassword",
  role: "USER",
  ...overrides,
});

const makeToken = (payload = {}) =>
  jwt.sign(
    { id: "user-001", email: "test@example.com", role: "USER", ...payload },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

// ─── Register ─────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a new user and returns 201", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user-001",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns 400 when email is already registered", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser());

    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it("returns 400 for validation error — missing name", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 for validation error — short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "abc",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 for validation error — invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "not-an-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 500 on unexpected prisma error", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "fail@example.com",
      password: "password123",
    });

    expect(res.status).toBe(500);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with valid credentials and returns token", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ password: hashed }));

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns 401 when email does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("returns 401 when password is wrong", async () => {
    const hashed = await bcrypt.hash("correctpassword", 10);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ password: hashed }));

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("returns 400 for missing email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 for empty password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// ─── JWT-Protected Route ───────────────────────────────────────────────────────
describe("GET /api/profile — JWT protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token/i);
  });

  it("returns 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", "Bearer this.is.not.a.valid.jwt");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  it("returns 401 for a malformed Authorization header (no Bearer prefix)", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", "NotBearer sometoken");

    expect(res.status).toBe(401);
  });

  it("returns 200 with user data for a valid token", async () => {
    const token = makeToken();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-001",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
    });

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@example.com");
  });

  it("returns 404 when user no longer exists in DB", async () => {
    const token = makeToken();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

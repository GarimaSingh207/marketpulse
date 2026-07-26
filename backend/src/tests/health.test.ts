import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toMatch(/marketpulse/i);
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent-route-xyz");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

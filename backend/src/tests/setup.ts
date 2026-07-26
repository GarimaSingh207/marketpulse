/**
 * Global test setup — runs before any test file is loaded.
 * Must set required environment variables before any module is imported
 * to avoid index.ts calling process.exit(1).
 */
import { vi, beforeAll, afterAll } from "vitest";

// ─── Required ENV vars (must be set before any src import) ────────────────────
process.env.JWT_SECRET = "test-jwt-secret-for-vitest-do-not-use-in-production";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
process.env.MARKET_API_KEY = "test-market-api-key";
process.env.NODE_ENV = "test";
process.env.REDIS_URL = "redis://localhost:6379";

// Suppress console noise during tests
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

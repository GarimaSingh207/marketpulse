import { vi } from "vitest";

/**
 * Vitest manual mock for src/lib/redis.ts
 * Prevents real Redis connections during tests.
 *
 * Usage in test file:
 *   vi.mock("../lib/redis", () => import("./mocks/redis.mock"));
 */

const redis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue("OK"),
};

export default redis;

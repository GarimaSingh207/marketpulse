import { vi } from "vitest";

/**
 * Vitest manual mock for src/lib/prisma.ts
 * Place this in src/tests/mocks/ and reference via vi.mock() in test files.
 *
 * Usage in test file:
 *   vi.mock("../lib/prisma", () => import("./mocks/prisma.mock"));
 */

const prisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  portfolio: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  holding: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
  watchlist: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  watchlistStock: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

export default prisma;

import { vi } from "vitest";

/**
 * Vitest manual mock for src/socket.ts
 * Prevents Socket.IO initialization during tests.
 * emitUserEvent becomes a no-op spy.
 *
 * Usage in test file:
 *   vi.mock("../socket", () => import("./mocks/socket.mock"));
 */

export const initSocketIO = vi.fn();
export const emitUserEvent = vi.fn();

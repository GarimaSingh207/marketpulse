import "@testing-library/jest-dom";

// ─── localStorage mock ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── matchMedia mock ──────────────────────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ─── scrollIntoView mock ─────────────────────────────────────────────────────
window.HTMLElement.prototype.scrollIntoView = () => {};

// ─── framer-motion mock (synchronous transitions for RTL testing) ─────────────
import { vi } from "vitest";

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (typeof key !== "string") return undefined;
        // Return standard HTML tag name strings (e.g., motion.div -> "div")
        // React natively renders string components as standard DOM tags.
        return key;
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
  };
});

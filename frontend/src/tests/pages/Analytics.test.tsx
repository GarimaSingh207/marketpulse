import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Analytics from "../../pages/Analytics";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { authenticatedUser } from "../mocks/authContext.mock";

// ─── Mock the api service ─────────────────────────────────────────────────────
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../services/api";
const mockApi = api as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderAnalytics(apiMock?: { portfolios?: any[] }) {
  const portfolios = apiMock?.portfolios ?? [];

  mockApi.get.mockImplementation((url: string) => {
    if (url.includes("/api/portfolios") && !url.includes("/value")) {
      return Promise.resolve({ data: portfolios });
    }
    if (url.includes("/value")) {
      return Promise.resolve({ data: { totalValue: 15000 } });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: authenticatedUser,
          token: "mock-token",
          isAuthenticated: true,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <SocketContext.Provider value={{ socket: null }}>
          <Analytics />
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Analytics / Performance page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading analytics", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: authenticatedUser,
            token: "mock-token",
            isAuthenticated: true,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <SocketContext.Provider value={{ socket: null }}>
            <Analytics />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders heading and performance attribution after data loads", async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText("Performance Analytics Workspace")).toBeInTheDocument();
    });
    expect(screen.getByText("Performance Attribution")).toBeInTheDocument();
  });

  it("renders key KPI cards after data loads", async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText("Total Return (YTD)")).toBeInTheDocument();
    });
    expect(screen.getByText("Realized Gain/Loss")).toBeInTheDocument();
    expect(screen.getByText("Max Drawdown (30D)")).toBeInTheDocument();
    expect(screen.getByText("Benchmark Comparison")).toBeInTheDocument();
  });

  it("allows switching timeframe buttons", async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText("Performance Attribution")).toBeInTheDocument();
    });

    const button1D = screen.getByRole("button", { name: "1D" });
    fireEvent.click(button1D);
    expect(button1D.className).toContain("active");
  });

  it("renders asset allocation and sector attribution sections", async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText("Performance Insights Workspace")).toBeInTheDocument();
    });
    expect(screen.getByText("Asset Allocation")).toBeInTheDocument();
    expect(screen.getByText("Sector Attribution")).toBeInTheDocument();
  });

  it("shows empty state when no portfolios exist", async () => {
    renderAnalytics({ portfolios: [] });

    await waitFor(() => {
      expect(screen.getByText(/no active portfolios found/i)).toBeInTheDocument();
    });
  });

  it("shows error banner when API fails", async () => {
    mockApi.get.mockRejectedValue({
      response: { data: { message: "Failed to load analytics data." } },
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: authenticatedUser,
            token: "mock-token",
            isAuthenticated: true,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <SocketContext.Provider value={{ socket: null }}>
            <Analytics />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
    });
  });
});

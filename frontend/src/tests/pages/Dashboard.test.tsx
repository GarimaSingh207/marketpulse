import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../../pages/Dashboard";
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
function renderDashboard(apiMock?: { portfolios?: any[]; watchlists?: any[] }) {
  const portfolios = apiMock?.portfolios ?? [];
  const watchlists = apiMock?.watchlists ?? [];

  // Mock api.get to return correct data per URL
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes("/api/portfolios") && !url.includes("/value")) {
      return Promise.resolve({ data: portfolios });
    }
    if (url.includes("/api/watchlists")) {
      return Promise.resolve({ data: watchlists });
    }
    if (url.includes("/value")) {
      return Promise.resolve({ data: { totalValue: 10000 } });
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
          <Dashboard />
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading", () => {
    // Never resolves — keeps loading state
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
            <Dashboard />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders welcome heading with user name after data loads", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it("renders stat cards after data loads", async () => {
    renderDashboard({ portfolios: [], watchlists: [] });

    await waitFor(() => {
      expect(screen.getByText("Total Portfolio Value")).toBeInTheDocument();
    });
    expect(screen.getByText("Portfolios")).toBeInTheDocument();
    expect(screen.getByText("Total Holdings")).toBeInTheDocument();
    expect(screen.getByText("Watchlists")).toBeInTheDocument();
  });

  it("shows portfolio count in stat card", async () => {
    const portfolios = [
      { id: "p1", name: "My Portfolio", userId: "user-001", holdings: [] },
    ];
    renderDashboard({ portfolios, watchlists: [] });

    await waitFor(() => {
      expect(screen.getByText("Portfolios")).toBeInTheDocument();
    });
    // The stat card shows the count "1"
    const statValues = screen.getAllByText("1");
    expect(statValues.length).toBeGreaterThan(0);
  });

  it("shows empty state for portfolios when none exist", async () => {
    renderDashboard({ portfolios: [], watchlists: [] });

    await waitFor(() => {
      expect(screen.getByText(/no portfolios created yet/i)).toBeInTheDocument();
    });
  });

  it("shows portfolio table when portfolios exist", async () => {
    const portfolios = [
      { id: "p1", name: "Tech Portfolio", userId: "user-001", holdings: [{ id: "h1" }] },
    ];
    renderDashboard({ portfolios, watchlists: [] });

    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    expect(screen.getByText("1 items")).toBeInTheDocument();
  });

  it("shows error banner when API fails", async () => {
    mockApi.get.mockRejectedValue({
      response: { data: { message: "Failed to load dashboard data." } },
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
            <Dashboard />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  it("renders New Portfolio link", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /new portfolio/i })).toBeInTheDocument();
    });
  });
});

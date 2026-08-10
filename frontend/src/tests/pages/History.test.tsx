import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import History from "../../pages/History";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { authenticatedUser } from "../mocks/authContext.mock";

// --- Mock the api service ---
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../services/api";
const mockApi = api as any;

const mockPortfolios = [
  {
    id: "p1",
    name: "Growth Core",
    holdings: [
      {
        id: "h1",
        portfolioId: "p1",
        symbol: "NVDA",
        quantity: 10,
        averagePrice: 400,
        transactions: [
          { id: "tx1", holdingId: "h1", type: "BUY", quantity: 6, price: 380, createdAt: "2026-08-09T10:00:00Z" },
          { id: "tx2", holdingId: "h1", type: "BUY", quantity: 4, price: 430, createdAt: "2026-08-09T14:00:00Z" },
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Tech High",
    holdings: [
      {
        id: "h2",
        portfolioId: "p2",
        symbol: "MSFT",
        quantity: 5,
        averagePrice: 300,
        transactions: [
          { id: "tx3", holdingId: "h2", type: "SELL", quantity: 2, price: 310, createdAt: "2026-08-08T09:00:00Z" },
        ],
      },
    ],
  },
];

const mockPortfolioValues = {
  p1: { portfolioId: "p1", totalValue: 4800, holdings: [] },
  p2: { portfolioId: "p2", totalValue: 1600, holdings: [] },
};

function renderHistory(ports: any[] = mockPortfolios, values: any = mockPortfolioValues) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/api/portfolios") {
      return Promise.resolve({ data: ports });
    }
    if (url.startsWith("/api/portfolios/") && url.endsWith("/value")) {
      const match = url.match(/\/api\/portfolios\/(.+)\/value/);
      const id = match ? match[1] : "";
      const val = values[id];
      if (val) {
        return Promise.resolve({ data: val });
      }
      return Promise.reject(new Error("Value not found"));
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter initialEntries={["/history"]}>
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
          <Routes>
            <Route path="/history" element={<History />} />
            <Route path="/stock/:symbol" element={<div>Stock details view</div>} />
          </Routes>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("History Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading ledger initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/history"]}>
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
            <History />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders summary ribbon stats correctly from loaded portfolios and values", async () => {
    renderHistory();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Transaction Ledger" })).toBeInTheDocument();
    });

    // Total cost basis = 10 * 400 + 5 * 300 = 4000 + 1500 = 5500
    expect(screen.getByText("$5,500.00")).toBeInTheDocument();

    // Total value = 4800 (p1) + 1600 (p2) = 6400
    expect(screen.getByText("$6,400.00")).toBeInTheDocument();

    // Unrealized P&L = 6400 - 5500 = +900 (+16.4%)
    expect(screen.getByText("+$900.00")).toBeInTheDocument();
    expect(screen.getByText("16.4%")).toBeInTheDocument();
  });

  it("groups transactions by date divider in table", async () => {
    renderHistory();

    await waitFor(() => {
      expect(screen.getAllByText("NVDA")[0]).toBeInTheDocument();
    });

    // Verify date headers are formatted and rendered
    const dateDivider1 = screen.getByText(/August 9, 2026/i);
    const dateDivider2 = screen.getByText(/August 8, 2026/i);
    expect(dateDivider1).toBeInTheDocument();
    expect(dateDivider2).toBeInTheDocument();
  });

  it("filters transaction ledger by search queries", async () => {
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getAllByText("NVDA")[0]).toBeInTheDocument();
    });
    expect(screen.getByText("MSFT")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search symbol/i);
    await user.type(searchInput, "NVDA");

    expect(screen.getAllByText("NVDA")[0]).toBeInTheDocument();
    expect(screen.queryByText("MSFT")).not.toBeInTheDocument();
  });

  it("filters transactions by buy/sell type", async () => {
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getAllByText("BUY").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("SELL")).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    const typeDropdown = selects[1]; // Index 1 is the Type select (Portfolios is index 0, Type is index 1, Sort is index 2)

    await user.selectOptions(typeDropdown, "BUY");

    expect(screen.queryByText("SELL")).not.toBeInTheDocument();
  });

  it("shows empty state when no transactions logged", async () => {
    renderHistory([], {});

    await waitFor(() => {
      expect(screen.getByText("No Logs Available")).toBeInTheDocument();
    });
  });

  it("shows error banner when portfolios loading fails", async () => {
    mockApi.get.mockRejectedValue({ response: { data: { message: "Failed to load portfolios" } } });
    render(
      <MemoryRouter initialEntries={["/history"]}>
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
            <History />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Failed to load portfolios")).toBeInTheDocument();
  });

  it("marks total portfolio value as N/A if a valuation fails to load", async () => {
    // Make one value call return null (failure)
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/api/portfolios") {
        return Promise.resolve({ data: mockPortfolios });
      }
      if (url.startsWith("/api/portfolios/") && url.endsWith("/value")) {
        return Promise.resolve(null);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <MemoryRouter initialEntries={["/history"]}>
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
            <History />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText("N/A")).length).toBeGreaterThan(0);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import StockDetails from "../../pages/StockDetails";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import { authenticatedUser } from "../mocks/authContext.mock";

// --- Mock the api service ---
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../services/api";
const mockApi = api as any;

const mockQuote = { symbol: "NVDA", currentPrice: 875.28 };
const mockWatchlists = [
  { id: "w1", name: "Tech Watch", stocks: [{ id: "s1", watchlistId: "w1", symbol: "AAPL" }] },
];
const mockPortfolios = [
  {
    id: "p1",
    name: "My Tech Port",
    holdings: [
      { id: "h1", portfolioId: "p1", symbol: "NVDA", quantity: 10, averagePrice: 800 },
    ],
  },
];

function renderStockDetails(symbol = "NVDA") {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes(`/api/market/price/${symbol}`)) {
      return Promise.resolve({ data: mockQuote });
    }
    if (url.includes("/api/watchlists")) {
      return Promise.resolve({ data: mockWatchlists });
    }
    if (url.includes("/api/portfolios")) {
      return Promise.resolve({ data: mockPortfolios });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter initialEntries={[`/stock/${symbol}`]}>
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
            <Route path="/stock/:symbol" element={<StockDetails />} />
            <Route path="/market" element={<div>Markets Workspace</div>} />
          </Routes>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("StockDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading stock details", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/stock/NVDA"]}>
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
              <Route path="/stock/:symbol" element={<StockDetails />} />
            </Routes>
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders page header and quote details after data loads", async () => {
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "NVIDIA Corp." })).toBeInTheDocument();
    });
    expect(screen.getByText("NVDA: NASDAQ")).toBeInTheDocument();
    expect(screen.getByText("$875.28")).toBeInTheDocument();
  });

  it("renders key stats and company intelligence as N/A or correct values", async () => {
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByText("NVIDIA Corp.")).toBeInTheDocument();
    });
    // Stats like Beta, Market Cap should show N/A
    const naElements = screen.getAllByText("N/A");
    expect(naElements.length).toBeGreaterThan(0);

    // Profile metadata sector/industry should render correctly
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Semiconductors")).toBeInTheDocument();
  });

  it("switches tabs correctly (Overview, Financials, Order Book, News)", async () => {
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByText("NVIDIA Corp.")).toBeInTheDocument();
    });

    // Check financial statements tab
    const financialsTab = screen.getByRole("button", { name: /financials/i });
    fireEvent.click(financialsTab);
    expect(await screen.findByText(/Financial Statements Unavailable/i)).toBeInTheDocument();

    // Check order book tab
    const orderBookTab = screen.getByRole("button", { name: /order book/i });
    fireEvent.click(orderBookTab);
    expect(await screen.findByText(/Order Book Stream Unavailable/i)).toBeInTheDocument();
  });

  it("performs watchlist tracking toggle correctly", async () => {
    const user = userEvent.setup();
    mockApi.post.mockResolvedValue({ data: {} });
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByText("Tech Watch")).toBeInTheDocument();
    });

    const trackBtn = screen.getByRole("button", { name: /track/i });
    await user.click(trackBtn);

    expect(mockApi.post).toHaveBeenCalledWith("/api/watchlists/w1/stocks", { symbol: "NVDA" });
  });

  it("submits a buy trade transaction correctly on existing holding", async () => {
    const user = userEvent.setup();
    mockApi.post.mockResolvedValue({ data: { transaction: {}, holding: {} } });
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByLabelText(/select portfolio/i)).toBeInTheDocument();
    });

    // Set qty and limit price
    const qtyInput = screen.getByPlaceholderText(/enter amount/i);
    const priceInput = screen.getByPlaceholderText(/limit price/i);

    await user.clear(qtyInput);
    await user.type(qtyInput, "5");
    await user.clear(priceInput);
    await user.type(priceInput, "875.28");

    const buyBtn = screen.getByRole("button", { name: /buy NVDA/i });
    await user.click(buyBtn);

    // It should hit holdings transaction route since NVDA is already in My Tech Port (holding h1)
    expect(mockApi.post).toHaveBeenCalledWith("/api/holdings/h1/transactions", {
      type: "BUY",
      quantity: 5,
      price: 875.28,
    });
  });

  it("submits a sell trade transaction correctly on existing holding", async () => {
    const user = userEvent.setup();
    mockApi.post.mockResolvedValue({ data: { transaction: {}, holding: {} } });
    renderStockDetails("NVDA");

    await waitFor(() => {
      expect(screen.getByLabelText(/select portfolio/i)).toBeInTheDocument();
    });

    // Switch to sell mode
    const sellModeBtn = screen.getByRole("button", { name: /^sell$/i });
    await user.click(sellModeBtn);

    const qtyInput = screen.getByPlaceholderText(/enter amount/i);
    const priceInput = screen.getByPlaceholderText(/limit price/i);

    await user.clear(qtyInput);
    await user.type(qtyInput, "2");
    await user.clear(priceInput);
    await user.type(priceInput, "875.00");

    const sellBtn = screen.getByRole("button", { name: /sell NVDA/i });
    await user.click(sellBtn);

    expect(mockApi.post).toHaveBeenCalledWith("/api/holdings/h1/transactions", {
      type: "SELL",
      quantity: 2,
      price: 875,
    });
  });

  it("shows error banner when quote fetch fails", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/api/market/price/NVDA")) {
        return Promise.reject({ response: { data: { message: "Rate limit exceeded." } } });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter initialEntries={["/stock/NVDA"]}>
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
              <Route path="/stock/:symbol" element={<StockDetails />} />
            </Routes>
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Rate limit exceeded.")).toBeInTheDocument();
  });
});

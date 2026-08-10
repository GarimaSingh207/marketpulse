import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PortfolioDetail from "../../pages/PortfolioDetail";
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

// --- Mock Socket ---
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
};

// --- Sample mock data ---
const mockHoldings = [
  {
    id: "h1",
    symbol: "NVDA",
    quantity: 10,
    averagePrice: "100.00",
    transactions: [
      { id: "t1", type: "BUY", quantity: 10, price: "100.00", createdAt: "2026-08-01T00:00:00.000Z" }
    ]
  },
  {
    id: "h2",
    symbol: "TSLA",
    quantity: 5,
    averagePrice: "200.00",
    transactions: [
      { id: "t2", type: "BUY", quantity: 5, price: "200.00", createdAt: "2026-08-02T00:00:00.000Z" }
    ]
  }
];

const mockPortfolio = {
  id: "p1",
  name: "Tech Fund",
  userId: "user-001",
  holdings: mockHoldings
};

const mockPortfolioValue = {
  portfolioId: "p1",
  totalValue: 2000,
  holdings: [
    { symbol: "NVDA", currentPrice: 150, totalValue: 1500, dailyChange: 5, dailyChangePercent: 3.45 },
    { symbol: "TSLA", currentPrice: 100, totalValue: 500, dailyChange: -2, dailyChangePercent: -2.00 }
  ]
};

function renderPortfolioDetail(portfolio: any = mockPortfolio, valueData: any = mockPortfolioValue) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/api/portfolios") {
      return Promise.resolve({ data: portfolio ? [portfolio] : [] });
    }
    if (url === "/api/portfolios/p1/value") {
      return Promise.resolve({ data: valueData });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter initialEntries={["/portfolios/p1"]}>
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
        <SocketContext.Provider value={{ socket: mockSocket as any }}>
          <Routes>
            <Route path="/portfolios/:id" element={<PortfolioDetail />} />
            <Route path="/portfolios" element={<div>Portfolios List</div>} />
          </Routes>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("PortfolioDetail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/portfolios/p1"]}>
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
              <Route path="/portfolios/:id" element={<PortfolioDetail />} />
            </Routes>
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders page header and portfolio metrics correctly after loading", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Tech Fund" })).toBeInTheDocument();
    });

    // Check Total Portfolio Value and Total Invested (both are $2,000.00)
    expect(screen.getAllByText("$2,000.00").length).toBe(2);
    // Unrealized P&L
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("0.00%")).toBeInTheDocument();
  });

  it("shows empty state when no holdings exist", async () => {
    const emptyPortfolio = { ...mockPortfolio, holdings: [] };
    const emptyValue = { portfolioId: "p1", totalValue: 0, holdings: [] };
    renderPortfolioDetail(emptyPortfolio, emptyValue);

    await waitFor(() => {
      expect(screen.getByText("No Positions Tracked")).toBeInTheDocument();
    });
    expect(screen.getByText("Add First Position")).toBeInTheDocument();
  });

  it("renders holdings list in a table correctly", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    expect(within(holdingsTable).getByText("NVDA")).toBeInTheDocument();
    expect(within(holdingsTable).getByText("TSLA")).toBeInTheDocument();

    // Check quantities and prices
    expect(within(holdingsTable).getByText("10")).toBeInTheDocument(); // NVDA Qty
    expect(within(holdingsTable).getByText("5")).toBeInTheDocument();  // TSLA Qty
    expect(within(holdingsTable).getByText("$150.00")).toBeInTheDocument(); // NVDA Live Price
    expect(within(holdingsTable).getByText("$100.00")).toBeInTheDocument(); // TSLA Live Price
  });

  it("filters holdings list by search query", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const searchInput = screen.getByPlaceholderText(/search symbol or name/i);
    
    fireEvent.change(searchInput, { target: { value: "TSLA" } });

    expect(within(holdingsTable).queryByText("NVDA")).not.toBeInTheDocument();
    expect(within(holdingsTable).getByText("TSLA")).toBeInTheDocument();
  });

  it("filters holdings by sector allocation", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const selects = screen.getAllByRole("combobox");
    
    // First select dropdown is Sector: All
    const sectorSelect = selects[0];
    fireEvent.change(sectorSelect, { target: { value: "Technology" } });

    expect(within(holdingsTable).getByText("NVDA")).toBeInTheDocument();
    expect(within(holdingsTable).queryByText("TSLA")).not.toBeInTheDocument();
  });

  it("filters holdings by P/L option", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const selects = screen.getAllByRole("combobox");
    
    // Second select dropdown is P/L: All
    const plSelect = selects[1];
    
    // Select "Profitable" (NVDA is profitable; TSLA is losing)
    fireEvent.change(plSelect, { target: { value: "Profitable" } });
    expect(within(holdingsTable).getByText("NVDA")).toBeInTheDocument();
    expect(within(holdingsTable).queryByText("TSLA")).not.toBeInTheDocument();

    // Select "Losing"
    fireEvent.change(plSelect, { target: { value: "Losing" } });
    expect(within(holdingsTable).queryByText("NVDA")).not.toBeInTheDocument();
    expect(within(holdingsTable).getByText("TSLA")).toBeInTheDocument();
  });

  it("sorts holdings correctly", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const selects = screen.getAllByRole("combobox");
    
    // Third select dropdown is Sort: Value
    const sortSelect = selects[2];

    // Select Symbol sorting
    fireEvent.change(sortSelect, { target: { value: "Symbol" } });
    const rows = within(holdingsTable).getAllByRole("row");
    // Row 0 is header. Row 1 should be NVDA (alphabetical), Row 2 should be TSLA
    expect(rows[1]).toHaveTextContent("NVDA");
    expect(rows[2]).toHaveTextContent("TSLA");
  });

  it("opens add position modal and submits new holding successfully", async () => {
    mockApi.post.mockResolvedValue({ data: { id: "h-new", symbol: "MSFT" } });
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Tech Fund" })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /add holding/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Add Stock Position")).toBeInTheDocument();

    const symbolInput = screen.getByLabelText(/stock symbol/i);
    const qtyInput = screen.getByLabelText(/share quantity/i);
    const priceInput = screen.getByLabelText(/average executed price/i);

    fireEvent.change(symbolInput, { target: { value: "MSFT" } });
    fireEvent.change(qtyInput, { target: { value: "10" } });
    fireEvent.change(priceInput, { target: { value: "300" } });

    fireEvent.submit(symbolInput.closest("form")!);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/api/portfolios/p1/holdings", {
        symbol: "MSFT",
        quantity: 10,
        averagePrice: 300,
      });
    });
  });

  it("submits buy transaction trade successfully", async () => {
    mockApi.post.mockResolvedValue({ data: { id: "t-new", type: "BUY" } });
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const nvdaRow = within(holdingsTable).getByText("NVDA").closest("tr")!;
    const tradeBtn = within(nvdaRow).getByRole("button", { name: "Trade" });
    fireEvent.click(tradeBtn);

    expect(screen.getByText("Trade Executions for NVDA")).toBeInTheDocument();

    const qtyInput = screen.getByLabelText(/order quantity/i);
    const priceInput = screen.getByLabelText(/order price/i);

    fireEvent.change(qtyInput, { target: { value: "2" } });
    fireEvent.change(priceInput, { target: { value: "155" } });

    fireEvent.submit(qtyInput.closest("form")!);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/api/holdings/h1/transactions", {
        type: "BUY",
        quantity: 2,
        price: 155,
      });
    });
  });

  it("submits sell transaction trade successfully", async () => {
    mockApi.post.mockResolvedValue({ data: { id: "t-new", type: "SELL" } });
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const nvdaRow = within(holdingsTable).getByText("NVDA").closest("tr")!;
    const tradeBtn = within(nvdaRow).getByRole("button", { name: "Trade" });
    fireEvent.click(tradeBtn);

    expect(screen.getByText("Trade Executions for NVDA")).toBeInTheDocument();

    // Select SELL ORDER radio
    const sellRadio = screen.getByLabelText("SELL ORDER").closest("label")!;
    fireEvent.click(sellRadio);

    const qtyInput = screen.getByLabelText(/order quantity/i);
    const priceInput = screen.getByLabelText(/order price/i);

    fireEvent.change(qtyInput, { target: { value: "3" } });
    fireEvent.change(priceInput, { target: { value: "148" } });

    fireEvent.submit(qtyInput.closest("form")!);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/api/holdings/h1/transactions", {
        type: "SELL",
        quantity: 3,
        price: 148,
      });
    });
  });

  it("renders transaction history logs correctly", async () => {
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getByText("Transaction History")).toBeInTheDocument();
    });

    const tables = screen.getAllByRole("table");
    const historyTable = tables[1];

    expect(within(historyTable).getByText("NVDA")).toBeInTheDocument();
    expect(within(historyTable).getAllByText("BUY").length).toBe(2);
    expect(within(historyTable).getByText("10")).toBeInTheDocument();
    expect(within(historyTable).getByText("$100.00")).toBeInTheDocument();
    expect(within(historyTable).getAllByText("$1,000.00").length).toBe(2);
  });

  it("opens deletion confirm dialog and deletes holding successfully", async () => {
    mockApi.delete.mockResolvedValue({ data: {} });
    renderPortfolioDetail();

    await waitFor(() => {
      expect(screen.getAllByRole("table").length).toBeGreaterThan(0);
    });

    const holdingsTable = screen.getAllByRole("table")[0];
    const nvdaRow = within(holdingsTable).getByText("NVDA").closest("tr")!;
    const deleteBtn = within(nvdaRow).getByRole("button", { name: "Delete holding NVDA" });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove the holding position/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Remove Holding/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith("/api/holdings/h1");
    });
  });

  it("shows error banner when loading fails", async () => {
    mockApi.get.mockRejectedValue({
      response: { data: { message: "Failed to fetch portfolio data." } }
    });

    render(
      <MemoryRouter initialEntries={["/portfolios/p1"]}>
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
              <Route path="/portfolios/:id" element={<PortfolioDetail />} />
            </Routes>
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch portfolio data/i)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Market from "../../pages/Market";
import { AuthContext } from "../../context/AuthContext";
import { authenticatedUser } from "../mocks/authContext.mock";

// --- Mock the api service ---
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../services/api";
const mockApi = api as any;

function renderMarket() {
  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith("/api/market/price/")) {
      const parts = url.split("/");
      const sym = parts[parts.length - 1];
      if (sym === "AAPL") {
        return Promise.resolve({
          data: {
            symbol: "AAPL",
            currentPrice: 175.5,
          },
        });
      }
      if (sym === "ERR") {
        return Promise.reject({
          response: { data: { message: "Invalid symbol format or ticker is unlisted" } },
        });
      }
      return Promise.resolve({
        data: {
          symbol: sym,
          currentPrice: 150 + sym.charCodeAt(0), // deterministic price for test stability
        },
      });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter initialEntries={["/market"]}>
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
        <Routes>
          <Route path="/market" element={<Market />} />
          <Route path="/stock/:symbol" element={<div>Mock Stock Workspace</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Market Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("loads and displays preset list stocks quotes on mount", async () => {
    renderMarket();

    // Check headers
    expect(await screen.findByRole("heading", { name: "Markets Workspace" })).toBeInTheDocument();

    // Verify some preset tickers render
    expect(screen.getByText("Trending Live")).toBeInTheDocument();
    expect(screen.getAllByText("NVDA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TSLA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MSFT").length).toBeGreaterThan(0);
  });

  it("performs ticker search lookup when typing symbol and pressing Enter", async () => {
    const user = userEvent.setup();
    renderMarket();

    // Find search bar
    const searchInput = await screen.findByPlaceholderText(/Search ticker symbol/i);
    expect(searchInput).toBeInTheDocument();

    // Type and search
    await user.type(searchInput, "AAPL{enter}");

    // Result card should render and show price
    const priceElements = await screen.findAllByText(/175\.50/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("displays error message if ticker search lookup fails", async () => {
    const user = userEvent.setup();
    renderMarket();

    const searchInput = await screen.findByPlaceholderText(/Search ticker symbol/i);

    await user.type(searchInput, "ERR{enter}");

    // Should render error banner
    expect(await screen.findByText(/Invalid symbol format/i)).toBeInTheDocument();
  });

  it("navigates to Stock Workspace detailed view when clicking details button in search card", async () => {
    const user = userEvent.setup();
    renderMarket();

    const searchInput = await screen.findByPlaceholderText(/Search ticker symbol/i);
    await user.type(searchInput, "AAPL{enter}");

    const detailsBtn = await screen.findByRole("button", { name: /Detailed Workspace/i });
    await user.click(detailsBtn);

    // Should redirect
    expect(screen.getByText("Mock Stock Workspace")).toBeInTheDocument();
  });

  it("renders local lookup search history correctly", async () => {
    // Seed localStorage
    localStorage.setItem("market_search_history", JSON.stringify(["NVDA", "TSLA"]));

    renderMarket();

    expect(await screen.findByText("Search Ticker History")).toBeInTheDocument();
    expect(screen.getAllByText("NVDA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TSLA").length).toBeGreaterThan(0);
  });

  it("clears local search logs when clear logs button is clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem("market_search_history", JSON.stringify(["NVDA"]));

    renderMarket();

    const clearBtn = await screen.findByRole("button", { name: /Clear Logs/i });
    await user.click(clearBtn);

    // Should display empty history text
    expect(screen.getByText("No recent lookups recorded.")).toBeInTheDocument();
    expect(localStorage.getItem("market_search_history")).toBeNull();
  });
});

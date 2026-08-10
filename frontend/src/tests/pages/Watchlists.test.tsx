import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Watchlists from "../../pages/Watchlists";
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

const mockWatchlists = [
  { id: "w1", name: "Tech Focus", stocks: [{ id: "s1", watchlistId: "w1", symbol: "NVDA", currentPrice: 800 }] },
  { id: "w2", name: "Empty List", stocks: [] },
];

function renderWatchlists(lists: any[] = mockWatchlists) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/api/watchlists") {
      return Promise.resolve({ data: lists });
    }
    if (url.startsWith("/api/watchlists/")) {
      const id = url.split("/").pop();
      const found = lists.find((l) => l.id === id);
      return Promise.resolve({ data: found || null });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  return render(
    <MemoryRouter initialEntries={["/watchlists"]}>
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
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/stock/:symbol" element={<div>Stock Workspace</div>} />
          </Routes>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Watchlists Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading watchlists initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/watchlists"]}>
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
            <Watchlists />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders page header and watchlists lists sidebar after data loads", async () => {
    renderWatchlists();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Watchlist Workspace" })).toBeInTheDocument();
    });
    expect(screen.getByText("Tech Focus")).toBeInTheDocument();
    expect(screen.getByText("Empty List")).toBeInTheDocument();
  });

  it("shows empty state when selected watchlist has no stocks", async () => {
    // Render with only the empty list
    renderWatchlists([mockWatchlists[1]]);

    await waitFor(() => {
      expect(screen.getByText("Watchlist Empty")).toBeInTheDocument();
    });
  });

  it("filters stocks in the selected watchlist correctly", async () => {
    const user = userEvent.setup();
    const mockMultiStocks = {
      id: "w1",
      name: "Tech Focus",
      stocks: [
        { id: "s1", watchlistId: "w1", symbol: "NVDA", currentPrice: 800 },
        { id: "s2", watchlistId: "w1", symbol: "MSFT", currentPrice: 420 },
      ],
    };
    renderWatchlists([mockMultiStocks]);

    await waitFor(() => {
      expect(screen.getByText("NVDA")).toBeInTheDocument();
    });
    expect(screen.getByText("MSFT")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/filter by symbol/i);
    await user.type(searchInput, "NVDA");

    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.queryByText("MSFT")).not.toBeInTheDocument();
  });

  it("creates a new watchlist correctly", async () => {
    const user = userEvent.setup();
    mockApi.post.mockResolvedValue({ data: { id: "w3", name: "New List", stocks: [] } });
    renderWatchlists();

    await waitFor(() => {
      expect(screen.getByText("Tech Focus")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /create watchlist/i });
    await user.click(createBtn);

    // Fill in modal form
    const nameInput = screen.getByLabelText(/watchlist name/i);
    await user.type(nameInput, "New List");

    const submitBtn = screen.getByRole("button", { name: /create list/i });
    await user.click(submitBtn);

    expect(mockApi.post).toHaveBeenCalledWith("/api/watchlists", { name: "New List" });
  });

  it("adds a stock symbol to the active watchlist correctly", async () => {
    const user = userEvent.setup();
    mockApi.post.mockResolvedValue({ data: {} });
    renderWatchlists();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add stock ticker/i })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /add stock ticker/i });
    await user.click(addBtn);

    const symbolInput = screen.getByLabelText(/stock symbol/i);
    await user.type(symbolInput, "TSLA");

    const submitBtn = screen.getByRole("button", { name: /add symbol/i });
    await user.click(submitBtn);

    expect(mockApi.post).toHaveBeenCalledWith("/api/watchlists/w1/stocks", { symbol: "TSLA" });
  });

  it("removes a stock symbol from the active watchlist correctly", async () => {
    const user = userEvent.setup();
    mockApi.delete.mockResolvedValue({ data: {} });
    renderWatchlists();

    await waitFor(() => {
      expect(screen.getByText("NVDA")).toBeInTheDocument();
    });

    const removeBtn = screen.getByTitle("Remove Symbol");
    await user.click(removeBtn);

    expect(mockApi.delete).toHaveBeenCalledWith("/api/watchlists/w1/stocks/NVDA");
  });

  it("deletes watchlist correctly after confirming dialog", async () => {
    const user = userEvent.setup();
    mockApi.delete.mockResolvedValue({ data: {} });
    renderWatchlists();

    await waitFor(() => {
      expect(screen.getByTitle("Delete Watchlist")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Delete Watchlist");
    await user.click(deleteBtn);

    // Confirm in confirm dialog
    const confirmButtons = screen.getAllByRole("button", { name: "Delete Watchlist" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(mockApi.delete).toHaveBeenCalledWith("/api/watchlists/w1");
  });

  it("shows error banner when watchlists loading fails", async () => {
    mockApi.get.mockRejectedValue({ response: { data: { message: "Failed to load watchlists." } } });
    render(
      <MemoryRouter initialEntries={["/watchlists"]}>
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
            <Watchlists />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Failed to load watchlists.")).toBeInTheDocument();
  });
});

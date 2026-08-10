import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Portfolios from "../../pages/Portfolios";
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

// --- Sample data ---
const mockPortfolios = [
  { id: "p1", name: "Tech Portfolio", userId: "user-001", holdings: [{ id: "h1" }, { id: "h2" }] },
  { id: "p2", name: "Growth Fund", userId: "user-001", holdings: [] },
];

// --- Helpers ---
function renderPortfolios(portfolios: any[] = []) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes("/api/portfolios") && !url.includes("/value")) {
      return Promise.resolve({ data: portfolios });
    }
    if (url.includes("/value")) {
      return Promise.resolve({
        data: { portfolioId: "p1", totalValue: 24500, holdings: [] },
      });
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
          <Portfolios />
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// --- Tests ---
describe("Portfolios page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading portfolios", () => {
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
            <Portfolios />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders page heading after data loads", async () => {
    renderPortfolios([]);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /portfolios/i })).toBeInTheDocument();
    });
  });

  it("shows empty state when no portfolios exist", async () => {
    renderPortfolios([]);
    await waitFor(() => {
      expect(screen.getByText(/no active portfolios/i)).toBeInTheDocument();
    });
  });

  it("renders portfolio cards when portfolios exist", async () => {
    renderPortfolios(mockPortfolios);
    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    expect(screen.getByText("Growth Fund")).toBeInTheDocument();
  });

  it("renders position counts on portfolio cards", async () => {
    renderPortfolios(mockPortfolios);
    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    expect(screen.getByText("2 Positions")).toBeInTheDocument();
    expect(screen.getByText("0 Positions")).toBeInTheDocument();
  });

  it("renders Manage Portfolio links for each portfolio", async () => {
    renderPortfolios(mockPortfolios);
    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    const links = screen.getAllByRole("link", { name: /manage portfolio/i });
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "/portfolios/p1");
    expect(links[1]).toHaveAttribute("href", "/portfolios/p2");
  });

  it("opens create portfolio modal when button is clicked", async () => {
    renderPortfolios([]);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /portfolios/i })).toBeInTheDocument();
    });
    const createBtns = screen.getAllByText(/create portfolio/i);
    fireEvent.click(createBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Create New Portfolio")).toBeInTheDocument();
    });
  });

  it("closes create modal on Cancel click", async () => {
    renderPortfolios([]);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /portfolios/i })).toBeInTheDocument();
    });
    const createBtns = screen.getAllByText(/create portfolio/i);
    fireEvent.click(createBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Create New Portfolio")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText("Create New Portfolio")).not.toBeInTheDocument();
    });
  });

  it("shows delete buttons for each portfolio", async () => {
    renderPortfolios(mockPortfolios);
    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: /delete portfolio/i });
    expect(deleteButtons.length).toBe(2);
  });

  it("opens confirm dialog when delete is clicked", async () => {
    renderPortfolios(mockPortfolios);
    await waitFor(() => {
      expect(screen.getByText("Tech Portfolio")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: /delete portfolio/i });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      // ConfirmDialog sets portfolioToDelete state — confirm it shows the dialog role
      // The description mentions the portfolio name "Tech Portfolio"
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });


  it("shows error banner when API fails", async () => {
    mockApi.get.mockRejectedValue({
      response: { data: { message: "Failed to load portfolios." } },
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
            <Portfolios />
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load portfolios/i)).toBeInTheDocument();
    });
  });

  it("calls POST /api/portfolios with portfolio name on form submit", async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.post.mockResolvedValue({ data: { id: "p-new", name: "New Fund" } });

    renderPortfolios([]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /portfolios/i })).toBeInTheDocument();
    });

    const createBtns = screen.getAllByText(/create portfolio/i);
    fireEvent.click(createBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Create New Portfolio")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/portfolio identifier/i);
    fireEvent.change(input, { target: { value: "New Fund" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/api/portfolios", { name: "New Fund" });
    });
  });
});

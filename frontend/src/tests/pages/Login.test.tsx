import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "../../pages/Login";
import { AuthContext } from "../../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderLogin(loginFn = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isAuthenticated: false,
          login: loginFn,
          register: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the email input", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders the password input", () => {
    renderLogin();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the Sign in button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders the MarketPulse logo text", () => {
    renderLogin();
    expect(screen.getByText("MarketPulse")).toBeInTheDocument();
  });

  it("has a link to the register page", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /create one/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute("href", "/register");
  });

  it("shows loading state while signing in", async () => {
    const user = userEvent.setup();
    // login never resolves — simulates long loading
    const loginFn = vi.fn().mockReturnValue(new Promise(() => {}));
    renderLogin(loginFn);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });

  it("navigates to /dashboard on successful login", async () => {
    const user = userEvent.setup();
    const loginFn = vi.fn().mockResolvedValue(undefined);
    renderLogin(loginFn);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("shows error banner on failed login", async () => {
    const user = userEvent.setup();
    const loginFn = vi.fn().mockRejectedValue({
      response: { data: { message: "Invalid credentials. Please try again." } },
    });
    renderLogin(loginFn);

    await user.type(screen.getByLabelText(/email address/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("restores Sign in button after failed login", async () => {
    const user = userEvent.setup();
    const loginFn = vi.fn().mockRejectedValue({
      response: { data: { message: "Invalid credentials. Please try again." } },
    });
    renderLogin(loginFn);

    await user.type(screen.getByLabelText(/email address/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
    });
  });
});

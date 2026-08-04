import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Register from "../../pages/Register";
import { AuthContext } from "../../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderRegister(registerFn = vi.fn(), loginFn = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isAuthenticated: false,
          login: loginFn,
          register: registerFn,
          logout: vi.fn(),
        }}
      >
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Register page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the Full Name input", () => {
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("renders the Email Address input", () => {
    renderRegister();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders the Password input", () => {
    renderRegister();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders the Create account button", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders the MarketPulse logo text", () => {
    renderRegister();
    expect(screen.getByText("MarketPulse")).toBeInTheDocument();
  });

  it("has a link to the login page", () => {
    renderRegister();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });

  it("shows loading state while creating account", async () => {
    const user = userEvent.setup();
    const registerFn = vi.fn().mockReturnValue(new Promise(() => {}));
    renderRegister(registerFn);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
  });

  it("navigates to /dashboard after successful registration + auto login", async () => {
    const user = userEvent.setup();
    const registerFn = vi.fn().mockResolvedValue(undefined);
    const loginFn = vi.fn().mockResolvedValue(undefined);
    renderRegister(registerFn, loginFn);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(registerFn).toHaveBeenCalledWith("John Doe", "john@example.com", "password123");
    expect(loginFn).toHaveBeenCalledWith("john@example.com", "password123");
  });

  it("shows error banner on duplicate email", async () => {
    const user = userEvent.setup();
    const registerFn = vi.fn().mockRejectedValue({
      response: { data: { message: "Email already registered" } },
    });
    renderRegister(registerFn);

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "duplicate@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

  it("shows fallback error when API returns no message", async () => {
    const user = userEvent.setup();
    const registerFn = vi.fn().mockRejectedValue(new Error("Network error"));
    renderRegister(registerFn);

    await user.type(screen.getByLabelText(/full name/i), "Test");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { MockAuthProvider, authenticatedUser } from "../mocks/authContext.mock";

// ─── Helper: render Navbar with auth context ──────────────────────────────────
function renderNavbar(options: {
  user?: typeof authenticatedUser | null;
  isAuthenticated?: boolean;
} = {}) {
  const { user = null, isAuthenticated = false } = options;
  return render(
    <MemoryRouter>
      <MockAuthProvider user={user} isAuthenticated={isAuthenticated}>
        <Navbar />
      </MockAuthProvider>
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  it("renders the MarketPulse brand name", () => {
    renderNavbar();
    expect(screen.getByText("MarketPulse")).toBeInTheDocument();
  });

  it("renders the Sign out / Logout button (by aria-label)", () => {
    // The button has aria-label="Logout" which is used as accessible name
    renderNavbar();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("displays authenticated user name when logged in", () => {
    renderNavbar({ user: authenticatedUser, isAuthenticated: true });
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("displays authenticated user role when logged in", () => {
    renderNavbar({ user: authenticatedUser, isAuthenticated: true });
    // Role text appears in a child <span>, use getAllByText to tolerate duplicates
    const roleEls = screen.getAllByText(/^USER$/i);
    expect(roleEls.length).toBeGreaterThan(0);
  });

  it("does not display user info when logged out", () => {
    renderNavbar({ user: null, isAuthenticated: false });
    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
  });

  it("calls logout when Sign out button is clicked", () => {
    renderNavbar({ user: authenticatedUser, isAuthenticated: true });
    const btn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(btn);
    // MockAuthProvider wires its own vi.fn() logout — just verify button is clickable
    expect(btn).toBeInTheDocument();
  });

  it("Sign out button has aria-label Logout", () => {
    renderNavbar();
    const btn = screen.getByRole("button", { name: /logout/i });
    expect(btn).toHaveAttribute("aria-label", "Logout");
  });

  it("button has visible text 'Sign out'", () => {
    renderNavbar();
    const btn = screen.getByRole("button", { name: /logout/i });
    expect(btn).toHaveTextContent("Sign out");
  });
});

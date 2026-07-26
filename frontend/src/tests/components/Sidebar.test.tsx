import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  it("renders the MarketPulse logo", () => {
    renderSidebar();
    expect(screen.getByText("MarketPulse")).toBeInTheDocument();
  });

  it("renders the Dashboard navigation link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders the Portfolios navigation link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /portfolios/i })).toBeInTheDocument();
  });

  it("renders the Watchlists navigation link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /watchlists/i })).toBeInTheDocument();
  });

  it("renders the Market navigation link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /market/i })).toBeInTheDocument();
  });

  it("Dashboard link points to /dashboard", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("Portfolios link points to /portfolios", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /portfolios/i });
    expect(link).toHaveAttribute("href", "/portfolios");
  });

  it("Watchlists link points to /watchlists", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /watchlists/i });
    expect(link).toHaveAttribute("href", "/watchlists");
  });

  it("Market link points to /market", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /market/i });
    expect(link).toHaveAttribute("href", "/market");
  });

  it("renders the main navigation landmark", () => {
    renderSidebar();
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
  });
});

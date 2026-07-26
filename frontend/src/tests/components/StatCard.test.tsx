import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "../../components/StatCard";

describe("StatCard", () => {
  it("renders the label", () => {
    render(<StatCard label="Total Value" value="$10,000" />);
    expect(screen.getByText("Total Value")).toBeInTheDocument();
  });

  it("renders the value as a string", () => {
    render(<StatCard label="Label" value="$10,000" />);
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("renders the value as a number", () => {
    render(<StatCard label="Count" value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the optional sub text when provided", () => {
    render(<StatCard label="Label" value="100" sub="+5% today" />);
    expect(screen.getByText("+5% today")).toBeInTheDocument();
  });

  it("does not render sub text when not provided", () => {
    render(<StatCard label="Label" value="100" />);
    expect(screen.queryByText("+5% today")).not.toBeInTheDocument();
  });

  it("applies the valueClass to the value element", () => {
    render(<StatCard label="Label" value="$5,000" valueClass="text-green" />);
    const valueEl = screen.getByText("$5,000");
    expect(valueEl).toHaveClass("text-green");
  });

  it("renders with default stat-card class", () => {
    const { container } = render(<StatCard label="Label" value="Value" />);
    expect(container.querySelector(".stat-card")).toBeInTheDocument();
  });
});

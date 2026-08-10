import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "../../components/Spinner";

describe("Spinner", () => {
  it("renders the spinner element", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("has aria-label Loading…", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading…");
  });

  it("renders inside a spinner-container wrapper", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector(".spinner-container")).toBeInTheDocument();
  });

  it("spinner elements have dot classes", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector(".spinner-dot")).toBeInTheDocument();
  });
});

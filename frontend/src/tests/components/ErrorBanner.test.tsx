import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBanner from "../../components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("displays the warning icon (⚠) alongside the message", () => {
    render(<ErrorBanner message="Network error" />);
    const banner = screen.getByText(/network error/i);
    expect(banner.parentElement ?? banner).toHaveTextContent("⚠");
  });

  it("renders with the error-banner class", () => {
    const { container } = render(<ErrorBanner message="Error" />);
    expect(container.firstChild).toHaveClass("error-banner");
  });

  it("renders different messages correctly", () => {
    const { rerender } = render(<ErrorBanner message="First error" />);
    expect(screen.getByText(/first error/i)).toBeInTheDocument();

    rerender(<ErrorBanner message="Second error" />);
    expect(screen.getByText(/second error/i)).toBeInTheDocument();
    expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
  });
});

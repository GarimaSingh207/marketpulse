import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../../components/Modal";

describe("Modal", () => {
  it("renders the title", () => {
    render(
      <Modal onClose={vi.fn()} title="Test Title">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <Modal onClose={vi.fn()} title="Title">
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByText("Modal body content")).toBeInTheDocument();
  });

  it("calls onClose when the overlay backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal onClose={onClose} title="Title">
        <p>Content</p>
      </Modal>
    );

    // Click the overlay (outermost div)
    const overlay = container.querySelector(".modal-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when the modal content area is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal onClose={onClose} title="Title">
        <p>Content</p>
      </Modal>
    );

    const modal = container.querySelector(".modal");
    expect(modal).not.toBeNull();
    fireEvent.click(modal!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("has role=dialog and aria-modal attributes", () => {
    render(
      <Modal onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

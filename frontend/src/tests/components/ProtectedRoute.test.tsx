import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import { MockAuthProvider, authenticatedUser } from "../mocks/authContext.mock";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderWithAuth(isAuthenticated: boolean) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <MockAuthProvider
        user={isAuthenticated ? authenticatedUser : null}
        isAuthenticated={isAuthenticated}
      >
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MockAuthProvider>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("renders protected content when authenticated", () => {
    renderWithAuth(true);
    expect(screen.getByText("Protected Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when NOT authenticated", () => {
    renderWithAuth(false);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Dashboard")).not.toBeInTheDocument();
  });
});

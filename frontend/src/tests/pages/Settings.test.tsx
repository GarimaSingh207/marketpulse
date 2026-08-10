import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Settings from "../../pages/Settings";
import { AuthContext } from "../../context/AuthContext";
import { authenticatedUser } from "../mocks/authContext.mock";

// --- Mock api service ---
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../services/api";
const mockApi = api as any;

const mockProfileResponse = {
  name: "Alex Rivera",
  email: "alex.r@marketpulse.io",
  role: "PREMIUM_USER",
};

function renderSettings(profileData: any = mockProfileResponse, rejectRequest = false) {
  if (rejectRequest) {
    mockApi.get.mockRejectedValue({ response: { data: { message: "Failed to fetch user profile" } } });
  } else {
    mockApi.get.mockResolvedValue({ data: profileData });
  }

  const mockLogout = vi.fn();

  const renderResult = render(
    <MemoryRouter initialEntries={["/settings"]}>
      <AuthContext.Provider
        value={{
          user: authenticatedUser,
          token: "mock-token",
          isAuthenticated: true,
          login: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
        }}
      >
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  return { ...renderResult, mockLogout };
}

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner while loading initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/settings"]}>
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
          <Settings />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders profile details and settings card options successfully", async () => {
    renderSettings();

    // Check header
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();

    // Check account info renders
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("alex.r@marketpulse.io")).toBeInTheDocument();
    expect(screen.getByText(/PREMIUM_USER/)).toBeInTheDocument();

    // Check tabs/sections are visible
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alert Configurations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trading Preferences" })).toBeInTheDocument();
  });

  it("falls back to user context profile if backend endpoint rejects requests", async () => {
    // Render with profile get request rejected
    renderSettings(null, true);

    // Verify name from authenticatedUser ("Test User") is loaded
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("allows selecting different select elements and triggers save locally", async () => {
    const user = userEvent.setup();
    renderSettings();

    // Verify Timezone and currency are visible
    const tzSelect = await screen.findByRole("combobox", { name: /Time Zone/i });
    expect(tzSelect).toBeInTheDocument();

    // Change value
    await user.selectOptions(tzSelect, "(GMT+00:00) UTC");
    expect(tzSelect).toHaveValue("(GMT+00:00) UTC");

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /Save Configuration/i });
    await user.click(submitBtn);

    // Should display success message
    expect(await screen.findByText(/successfully saved/i)).toBeInTheDocument();
  });

  it("disables light mode theme switch indicating N/A", async () => {
    renderSettings();

    // Find Dark button and disabled Light button
    const darkBtn = await screen.findByRole("button", { name: "Dark" });
    const lightBtn = screen.getByRole("button", { name: "Light (N/A)" });

    expect(darkBtn).toBeInTheDocument();
    expect(lightBtn).toBeDisabled();
  });

  it("triggers logout when terminate session button is clicked", async () => {
    const user = userEvent.setup();
    const { mockLogout } = renderSettings();

    const logoutBtn = await screen.findByRole("button", { name: /Terminate Session/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

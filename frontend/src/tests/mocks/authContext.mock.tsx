import { ReactNode } from "react";
import { vi } from "vitest";
import type { User } from "../../types";
import { AuthContext } from "../../context/AuthContext";

interface MockAuthOptions {
  user?: User | null;
  token?: string | null;
  isAuthenticated?: boolean;
}

/**
 * Wraps children in a mock AuthContext with controllable values.
 * Use this in tests instead of <AuthProvider> to avoid real API calls.
 */
export function MockAuthProvider({
  children,
  user = null,
  token = null,
  isAuthenticated = false,
}: MockAuthOptions & { children: ReactNode }) {
  const value = {
    user,
    token,
    isAuthenticated,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience: pre-authenticated user mock */
export const authenticatedUser: User = {
  id: "user-001",
  name: "Test User",
  email: "test@example.com",
  role: "USER",
};

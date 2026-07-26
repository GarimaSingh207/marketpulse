import { ReactNode } from "react";
import { SocketContext } from "../../context/SocketContext";

/**
 * No-op SocketContext provider for tests.
 * Prevents real socket.io-client connections during testing.
 */
export function MockSocketProvider({ children }: { children: ReactNode }) {
  return (
    <SocketContext.Provider value={{ socket: null }}>
      {children}
    </SocketContext.Provider>
  );
}

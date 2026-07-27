import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextValue {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextValue>({ socket: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Only connect when authenticated
    if (!isAuthenticated || !token) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      return;
    }

    // In production, Socket.IO connects to the same origin as the frontend (Nginx on port 80).
    // Nginx proxies /socket.io/ to the backend container with WebSocket upgrade headers.
    // window.location.origin resolves correctly at runtime in the browser without any hardcoded IP.
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socketInstance = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[socket] Connection error:", err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}

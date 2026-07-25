import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

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

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

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

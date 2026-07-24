import { useEffect, useState } from "react";
import api from "../services/api";

interface HealthResponse {
  status: string;
  message: string;
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<boolean>(false);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get<HealthResponse>("/api/health");
      setHealthData(response.data);
    } catch (err) {
      setError(true);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  return (
    <div className="container">
      <h1>MarketPulse</h1>
      <p className="subtitle">Full-Stack Financial Analytics Platform</p>

      <div className="status-card">
        <h3>Backend Status</h3>

        {loading && <p className="status-message">Loading...</p>}

        {!loading && error && (
          <>
            <p className="status-badge">🔴 Backend Offline</p>
            <p className="status-message">Unable to connect to the backend server.</p>
          </>
        )}

        {!loading && healthData && (
          <>
            <p className="status-badge">🟢 Backend Connected</p>
            <p className="status-message">{healthData.message}</p>
          </>
        )}
      </div>

      <button onClick={fetchHealthStatus} disabled={loading}>
        Refresh Status
      </button>
    </div>
  );
}

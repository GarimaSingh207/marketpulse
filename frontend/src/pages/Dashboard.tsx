import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, Watchlist, PortfolioValue } from "../types";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [portRes, watchRes] = await Promise.all([
        api.get<Portfolio[]>("/api/portfolios"),
        api.get<Watchlist[]>("/api/watchlists"),
      ]);

      const fetchedPortfolios = portRes.data;
      setPortfolios(fetchedPortfolios);
      setWatchlists(watchRes.data);

      // Fetch valuation for all portfolios to compute overall net worth
      if (fetchedPortfolios.length > 0) {
        const valuePromises = fetchedPortfolios.map((p) =>
          api.get<PortfolioValue>(`/api/portfolios/${p.id}/value`).catch(() => null)
        );
        const values = await Promise.all(valuePromises);
        const sum = values.reduce((acc, v) => acc + (v?.data.totalValue || 0), 0);
        setTotalValue(Number(sum.toFixed(2)));
      } else {
        setTotalValue(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on("portfolio:created", handleUpdate);
    socket.on("portfolio:deleted", handleUpdate);
    socket.on("holding:created", handleUpdate);
    socket.on("holding:deleted", handleUpdate);
    socket.on("transaction:created", handleUpdate);
    socket.on("portfolio:valueUpdated", handleUpdate);
    socket.on("watchlist:created", handleUpdate);
    socket.on("watchlist:deleted", handleUpdate);
    socket.on("watchlist:stockAdded", handleUpdate);
    socket.on("watchlist:stockRemoved", handleUpdate);

    return () => {
      socket.off("portfolio:created", handleUpdate);
      socket.off("portfolio:deleted", handleUpdate);
      socket.off("holding:created", handleUpdate);
      socket.off("holding:deleted", handleUpdate);
      socket.off("transaction:created", handleUpdate);
      socket.off("portfolio:valueUpdated", handleUpdate);
      socket.off("watchlist:created", handleUpdate);
      socket.off("watchlist:deleted", handleUpdate);
      socket.off("watchlist:stockAdded", handleUpdate);
      socket.off("watchlist:stockRemoved", handleUpdate);
    };
  }, [socket, fetchDashboardData]);

  if (loading) return <Spinner />;

  const totalHoldingsCount = portfolios.reduce((acc, p) => acc + (p.holdings?.length || 0), 0);

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
          <p className="text-muted">Here is your financial portfolio overview.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/portfolios" className="btn btn-primary">
            + New Portfolio
          </Link>
          <Link to="/watchlists" className="btn btn-ghost">
            + New Watchlist
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="stat-grid">
        <StatCard
          label="Total Portfolio Value"
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub="Live market calculation"
          valueClass="text-green"
        />
        <StatCard label="Portfolios" value={portfolios.length} sub="Active portfolios" />
        <StatCard label="Total Holdings" value={totalHoldingsCount} sub="Assets tracked" />
        <StatCard label="Watchlists" value={watchlists.length} sub="Custom lists" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Portfolios Overview Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Portfolios Summary</h2>
            <Link to="/portfolios" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>

          {portfolios.length === 0 ? (
            <EmptyState icon="💼" message="No portfolios created yet. Create one to start tracking." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Holdings</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.holdings?.length || 0} items</td>
                      <td className="text-right">
                        <Link to={`/portfolios/${p.id}`} className="btn btn-ghost btn-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Watchlists Overview Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Watchlists Summary</h2>
            <Link to="/watchlists" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>

          {watchlists.length === 0 ? (
            <EmptyState icon="👁" message="No watchlists created yet. Create one to track favorite stocks." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Watchlist Name</th>
                    <th>Tracked Symbols</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlists.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.name}</td>
                      <td>{w.stocks?.length || 0} stocks</td>
                      <td className="text-right">
                        <Link to="/watchlists" className="btn btn-ghost btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

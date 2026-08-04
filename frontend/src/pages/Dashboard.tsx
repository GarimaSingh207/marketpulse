import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, Watchlist, PortfolioValue } from "../types";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import {
  Briefcase,
  Eye,
  ArrowUpRight,
  Plus,
  TrendingUp,
  BarChart2,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Greeting based on time of day
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Deterministic color from index
const CHART_COLORS = [
  "#7C6EF5", "#34D399", "#60A5FA", "#FBBF24",
  "#F472B6", "#A78BFA", "#4ADE80", "#38BDF8",
];

interface PortfolioWithValue extends Portfolio {
  liveValue?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<PortfolioWithValue[]>([]);
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
      setWatchlists(watchRes.data);

      if (fetchedPortfolios.length > 0) {
        const withValues = await Promise.all(
          fetchedPortfolios.map(async (p) => {
            try {
              const valRes = await api.get<PortfolioValue>(`/api/portfolios/${p.id}/value`);
              return { ...p, liveValue: valRes.data.totalValue };
            } catch {
              return { ...p, liveValue: 0 };
            }
          })
        );
        setPortfolios(withValues);
        const sum = withValues.reduce((acc, p) => acc + (p.liveValue || 0), 0);
        setTotalValue(Number(sum.toFixed(2)));
      } else {
        setPortfolios([]);
        setTotalValue(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchDashboardData();
    const events = [
      "portfolio:created", "portfolio:deleted", "holding:created",
      "holding:deleted", "transaction:created", "portfolio:valueUpdated",
      "watchlist:created", "watchlist:deleted", "watchlist:stockAdded", "watchlist:stockRemoved",
    ];
    events.forEach((e) => socket.on(e, handleUpdate));
    return () => events.forEach((e) => socket.off(e, handleUpdate));
  }, [socket, fetchDashboardData]);

  if (loading) return <Spinner text="Loading dashboard…" />;

  const totalHoldingsCount = portfolios.reduce((acc, p) => acc + (p.holdings?.length || 0), 0);

  // Pie chart data from portfolios
  const pieData = portfolios
    .filter((p) => (p.liveValue || 0) > 0)
    .map((p) => ({ name: p.name, value: p.liveValue || 0 }));

  return (
    <div className="section-gap">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="page-title">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="page-subtitle">Here's your financial overview for today.</p>
        </div>
        <div className="page-actions">
          <Link to="/portfolios" className="btn btn-primary" aria-label="Create new portfolio">
            <Plus size={15} strokeWidth={2.5} />
            <span>New Portfolio</span>
          </Link>
          <Link to="/watchlists" className="btn btn-ghost" aria-label="Create new watchlist">
            <Plus size={15} strokeWidth={2.5} />
            <span>Watchlist</span>
          </Link>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} />}

      {/* ── Stats Grid ─────────────────────────────────────────────── */}
      <motion.div
        className="stat-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label="Total Portfolio Value"
            value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            sub="Live market valuation"
            valueClass="text-profit mono"
            icon={<TrendingUp size={16} strokeWidth={2.5} />}
            iconVariant="profit"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Portfolios"
            value={portfolios.length}
            sub="Active portfolios"
            icon={<Briefcase size={16} strokeWidth={2.5} />}
            iconVariant="accent"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Total Holdings"
            value={totalHoldingsCount}
            sub="Assets tracked"
            icon={<BarChart2 size={16} strokeWidth={2.5} />}
            iconVariant="accent"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Watchlists"
            value={watchlists.length}
            sub="Custom lists"
            icon={<Eye size={16} strokeWidth={2.5} />}
            iconVariant="warn"
          />
        </motion.div>
      </motion.div>

      {/* ── Overview Grid ──────────────────────────────────────────── */}
      <div className="two-col-grid">
        {/* Portfolios card */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase size={16} className="text-muted" aria-hidden="true" />
              <h2 className="card-title">Portfolios</h2>
            </div>
            <Link to="/portfolios" className="btn btn-ghost btn-sm" aria-label="View all portfolios">
              <span>View all</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {portfolios.length === 0 ? (
            <EmptyState
              icon={<Briefcase size={22} />}
              title="No portfolios yet"
              message="Create your first portfolio to start tracking investments."
              action={
                <Link to="/portfolios" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Create Portfolio
                </Link>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table" aria-label="Portfolios overview">
                <thead>
                  <tr>
                    <th>Portfolio</th>
                    <th>Holdings</th>
                    <th>Live Value</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: CHART_COLORS[i % CHART_COLORS.length],
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          />
                          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-accent">
                          {p.holdings?.length || 0} items
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-mono"
                          style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--profit)" }}
                        >
                          ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/portfolios/${p.id}`}
                          className="btn btn-ghost btn-sm"
                          aria-label={`View portfolio ${p.name}`}
                        >
                          <span>Manage</span>
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Watchlists card */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={16} className="text-muted" aria-hidden="true" />
              <h2 className="card-title">Watchlists</h2>
            </div>
            <Link to="/watchlists" className="btn btn-ghost btn-sm" aria-label="View all watchlists">
              <span>View all</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {watchlists.length === 0 ? (
            <EmptyState
              icon={<Eye size={22} />}
              title="No watchlists yet"
              message="Track your favorite stocks with a custom watchlist."
              action={
                <Link to="/watchlists" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Create Watchlist
                </Link>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table" aria-label="Watchlists overview">
                <thead>
                  <tr>
                    <th>Watchlist</th>
                    <th>Tracked</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlists.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "var(--warn)",
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          />
                          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{w.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-warn">
                          {w.stocks?.length || 0} stocks
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          to="/watchlists"
                          className="btn btn-ghost btn-sm"
                          aria-label={`View watchlist ${w.name}`}
                        >
                          <span>View</span>
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Allocation Chart ───────────────────────────────────────── */}
      {pieData.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={16} className="text-muted" aria-hidden="true" />
              <h2 className="card-title">Portfolio Allocation</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            {/* Donut chart */}
            <div style={{ height: "200px" }} aria-label="Portfolio allocation chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--overlay-strong)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "var(--r-md)",
                      fontSize: "0.8rem",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    formatter={(value: any) =>
                      [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Value"]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pieData.map((entry, i) => {
                const pct = ((entry.value / totalValue) * 100).toFixed(1);
                return (
                  <div
                    key={entry.name}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "3px",
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                        {entry.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className="text-mono"
                        style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}
                      >
                        ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="badge badge-neutral">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

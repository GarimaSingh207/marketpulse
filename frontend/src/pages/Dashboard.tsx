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
  Plus,
  TrendingUp,
  BarChart2,
  Activity,
  Search,
  Bell,
  Info,
  Grid,
  History,
  Calendar,
  Newspaper,
  ArrowRight,
} from "lucide-react";
import "./Dashboard.css";

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

// Initial placeholder items for Market Movers
const INITIAL_MOVERS = [
  { symbol: "SMCI", name: "Super Micro Computer", price: "$824.50", change: "+8.42%", logo: "SM" },
  { symbol: "TSM", name: "TSMC ADR", price: "$152.12", change: "+5.11%", logo: "TS" },
  { symbol: "ARM", name: "ARM Holdings", price: "$118.40", change: "+4.95%", logo: "AR" },
  { symbol: "MU", name: "Micron Tech", price: "$128.25", change: "+3.88%", logo: "MU" },
];

// Initial placeholder news articles
const INITIAL_NEWS = [
  { source: "REUTERS", time: "12m ago", sentiment: "Positive", headline: "Tech sector leads market rally as inflation data cools faster than expected; NASDAQ hits new high." },
  { source: "BLOOMBERG", time: "1h ago", sentiment: "Neutral", headline: "Oil prices stabilize after OPEC+ members agree to maintain production cuts through Q3." },
  { source: "CNBC", time: "2h ago", sentiment: "Negative", headline: "Federal Reserve minutes reveal internal debate on timing of initial rate cuts amidst sticky costs." },
  { source: "WSJ", time: "3h ago", sentiment: "Positive", headline: "Global chip shortage eases as major foundries increase utilization rates to near-peak capacity." },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<PortfolioWithValue[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalCostBasis, setTotalCostBasis] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y" | "MAX">("1M");
  const [moverTab, setMoverTab] = useState<"GAINERS" | "LOSERS">("GAINERS");

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
        let overallCostBasis = 0;
        const withValues = await Promise.all(
          fetchedPortfolios.map(async (p) => {
            const portfolioCostBasis = (p.holdings || []).reduce(
              (sum, h) => sum + h.quantity * Number(h.averagePrice),
              0
            );
            overallCostBasis += portfolioCostBasis;

            const valRes = await api.get<PortfolioValue>(`/api/portfolios/${p.id}/value`);
            return { ...p, liveValue: valRes.data.totalValue };
          })
        );
        setPortfolios(withValues);
        const sum = withValues.reduce((acc, p) => acc + (p.liveValue || 0), 0);
        setTotalValue(Number(sum.toFixed(2)));
        setTotalCostBasis(overallCostBasis);
      } else {
        setPortfolios([]);
        setTotalValue(0);
        setTotalCostBasis(0);
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
  const formattedTotalValue = totalValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const allTimeGain = totalValue - totalCostBasis;
  const allTimeGainPercent = totalCostBasis > 0 ? (allTimeGain / totalCostBasis) * 100 : 0;
  const allTimeSign = allTimeGain >= 0 ? "+" : "";

  const recentTransactions = portfolios
    .flatMap((p) =>
      (p.holdings || []).flatMap((h) =>
        (h.transactions || []).map((t) => ({
          ...t,
          symbol: h.symbol,
          portfolioName: p.name,
        }))
      )
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-full-bleed">
      {/* ── Fixed Ticker Bar ────────────────────────────────────────────────── */}
      <div className="dashboard-ticker-bar" aria-label="Live Market Ticker">
        <div className="dashboard-ticker-track">
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">S&amp;P 500</span>
            <span className="dashboard-ticker-price">5,204.34</span>
            <span className="dashboard-ticker-change">+0.45%</span>
          </div>
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">NASDAQ</span>
            <span className="dashboard-ticker-price">16,384.47</span>
            <span className="dashboard-ticker-change">+1.12%</span>
          </div>
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">BTC/USD</span>
            <span className="dashboard-ticker-price">67,492.10</span>
            <span className="dashboard-ticker-change">+2.31%</span>
          </div>
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">GOLD</span>
            <span className="dashboard-ticker-price">2,391.20</span>
            <span className="dashboard-ticker-change negative">-0.12%</span>
          </div>
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">AAPL</span>
            <span className="dashboard-ticker-price">192.25</span>
            <span className="dashboard-ticker-change">+0.82%</span>
          </div>
          {/* Duplicate for seamless loop */}
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">S&amp;P 500</span>
            <span className="dashboard-ticker-price">5,204.34</span>
            <span className="dashboard-ticker-change">+0.45%</span>
          </div>
          <div className="dashboard-ticker-item">
            <span className="dashboard-ticker-symbol">NASDAQ</span>
            <span className="dashboard-ticker-price">16,384.47</span>
            <span className="dashboard-ticker-change">+1.12%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-root">
        {/* ── Top App Bar ──────────────────────────────────────────────────── */}
        <header className="dashboard-appbar">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div className="dashboard-search-wrap">
              <Search size={16} className="dashboard-search-icon" />
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search Markets…"
                aria-label="Search Markets"
              />
            </div>
            <nav className="dashboard-nav-tabs">
              <span className="dashboard-nav-tab active">Overview</span>
              <span className="dashboard-nav-tab">Performance</span>
              <span className="dashboard-nav-tab">Positions</span>
              <span className="dashboard-nav-tab">History</span>
            </nav>
          </div>

          <div className="dashboard-header-actions">
            <Link to="/portfolios" className="dashboard-btn-gold" aria-label="New Portfolio">
              <Plus size={14} /> New Portfolio
            </Link>
            <Link to="/market" className="dashboard-btn-stone" aria-label="Explore Market">
              <Activity size={14} /> Explore Market
            </Link>
            <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(77, 70, 57, 0.2)" }} />
            <button style={{ color: "#d1c5b4", background: "none", border: "none", cursor: "pointer" }} aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* ── Main content with padding ─────────────────────────────────────── */}
        <div className="dashboard-inner">

          {/* Welcome heading (test anchor) */}
          <h1 className="dashboard-welcome">
            Welcome back, {user?.name || "Trader"} 👋
          </h1>

          {error && <ErrorBanner message={error} />}

          {/* ── Hero: Portfolio Value + Market Snapshot ─────────────────────── */}
          <div className="dashboard-grid-12" style={{ marginBottom: "1.5rem" }}>

            {/* Left hero (9 cols) */}
            <div style={{ gridColumn: "span 9", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Value header */}
              <div>
                <div className="hero-live-badge">
                  <span className="hero-pulse-dot" />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--dash-primary)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                    Live Portfolio Value
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.25rem" }}>
                  <h2 className="hero-value-display">
                    <span className="hero-value-currency">$</span>
                    <span>{formattedTotalValue}</span>
                  </h2>
                  <div className="hero-timeframes">
                    {(["1D", "1W", "1M", "1Y", "MAX"] as const).map((tf) => (
                      <button
                        key={tf}
                        className={`hero-tf-btn ${timeframe === tf ? "active" : ""}`}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                {totalCostBasis > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                    <span style={{ color: "rgba(209, 197, 180, 0.6)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      All-time Return: {allTimeSign}{allTimeGainPercent.toFixed(2)}% (${allTimeSign}{allTimeGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                )}
              </div>

              {/* Performance Chart Card */}
              <div className="bento-card" style={{ padding: "1.5rem", height: "340px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--dash-on-surface-variant)" }}>
                    Portfolio Performance vs S&amp;P 500
                  </span>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "10px", color: "var(--dash-on-surface-variant)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dash-primary)" }} /> Portfolio
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dash-secondary)" }} /> S&amp;P 500
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, position: "relative", marginTop: "1rem" }}>
                  <svg style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none" viewBox="0 0 1200 300">
                    <defs>
                      <linearGradient id="dashChartGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#e8c177" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#e8c177" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 180 Q 150 150, 300 220 T 600 180 T 900 200 T 1200 80" fill="none" stroke="#e8c177" strokeWidth="2" />
                    <path d="M0 180 Q 150 150, 300 220 T 600 180 T 900 200 T 1200 80 V 300 H 0 Z" fill="url(#dashChartGrad)" />
                    <path d="M0 210 Q 150 190, 300 240 T 600 220 T 900 230 T 1200 140" fill="none" stroke="#bac3ff" strokeDasharray="4 4" strokeWidth="1.5" />
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgba(209, 197, 180, 0.4)" }}>
                  <span>MAY 01</span>
                  <span>MAY 15</span>
                  <span>MAY 31</span>
                </div>
              </div>
            </div>

            {/* Market Snapshot Column (3 cols) */}
            <div style={{ gridColumn: "span 3" }}>
              <div className="bento-card" style={{ height: "100%", padding: "1.25rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div>
                    <h3 className="bento-card-title">Market Snapshot</h3>
                    <p style={{ fontSize: "10px", color: "var(--dash-on-surface-variant)", opacity: 0.6, marginTop: "2px" }}>Global Trading Status</p>
                  </div>
                  <span style={{ padding: "0.2rem 0.5rem", backgroundColor: "rgba(232, 193, 119, 0.1)", border: "1px solid rgba(232, 193, 119, 0.2)", borderRadius: "2px", color: "var(--dash-primary)", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Market Open
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                  {[
                    { label: "Last Data Sync", value: "Just now", color: undefined },
                    { label: "VIX Volatility", value: "13.42 (-2.1%)", color: "var(--dash-primary)" },
                    { label: "10Y Treasury", value: "4.38% (+0.02)", color: undefined },
                    { label: "Put/Call Ratio", value: "0.84 (Bullish)", color: undefined },
                    { label: "Fear & Greed", value: "72 (Greed)", color: "var(--dash-primary)" },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--dash-outline-variant)", fontSize: "12px" }}>
                      <span style={{ color: "var(--dash-on-surface-variant)" }}>{row.label}</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--dash-surface-low)", border: "1px solid var(--dash-outline-variant)", borderRadius: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--dash-primary)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                    <Info size={14} /> Trading Note
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--dash-on-surface-variant)", lineHeight: 1.4 }}>
                    Institutional volume in mega-cap tech rising ahead of tomorrow's CPI. Liquidity remains high.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
          <motion.div
            className="stat-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ marginBottom: "1.5rem" }}
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

          {/* ── Mid Row: Sector Performance | Core Holdings | Market Movers ────── */}
          <div className="dashboard-grid-12" style={{ marginBottom: "1.5rem" }}>

            {/* Sector Performance (3 Cols) */}
            <div style={{ gridColumn: "span 3" }} className="bento-card">
              <div className="bento-card-header">
                <h3 className="bento-card-title">Sector Performance</h3>
                <Grid size={16} style={{ color: "var(--dash-on-surface-variant)" }} />
              </div>
              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Technology", value: "+2.42%", color: "var(--dash-primary)", width: "85%", cls: "positive" },
                  { label: "Energy", value: "+1.15%", color: "var(--dash-primary)", width: "45%", cls: "positive" },
                  { label: "Healthcare", value: "-0.42%", color: "var(--dash-error)", width: "25%", cls: "negative" },
                  { label: "Financials", value: "+0.88%", color: "var(--dash-primary)", width: "35%", cls: "positive" },
                  { label: "Materials", value: "0.00%", color: undefined, width: "10%", cls: "" },
                ].map((sector) => (
                  <div key={sector.label} className="sector-row">
                    <div className="sector-meta">
                      <span>{sector.label}</span>
                      <span style={{ color: sector.color, fontFamily: "var(--font-mono)" }}>{sector.value}</span>
                    </div>
                    <div className="sector-bar-bg">
                      <div
                        className={`sector-bar-fill ${sector.cls}`}
                        style={{ width: sector.width, ...(sector.cls === "" ? { backgroundColor: "rgba(255,255,255,0.1)" } : {}) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Holdings (5 Cols) */}
            <div style={{ gridColumn: "span 5" }} className="bento-card">
              <div className="bento-card-header">
                <h3 className="bento-card-title">Core Holdings</h3>
                <Link to="/portfolios" style={{ color: "var(--dash-primary)", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  FULL PORTFOLIO <ArrowRight size={12} />
                </Link>
              </div>

              {portfolios.length === 0 ? (
                <div style={{ padding: "2rem 1rem" }}>
                  <EmptyState
                    icon={<Briefcase size={22} />}
                    title="No portfolios created yet"
                    message="Create your first portfolio to start tracking investments."
                    action={
                      <Link to="/portfolios" className="dashboard-btn-gold">
                        <Plus size={14} /> Create Portfolio
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {portfolios.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "0.85rem 1.25rem",
                        borderBottom: "1px solid var(--dash-outline-variant)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="logo-placeholder-sm">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 700 }}>{p.name}</p>
                          <p style={{ fontSize: "9px", color: "var(--dash-on-surface-variant)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                            {p.holdings?.length || 0} items • Active
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 }}>
                          ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <span className="badge badge-accent" style={{ fontSize: "9px" }}>
                          {p.holdings?.length || 0} items
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Market Movers (4 Cols) */}
            <div style={{ gridColumn: "span 4" }} className="bento-card">
              <div className="bento-card-header">
                <h3 className="bento-card-title">Market Movers</h3>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      backgroundColor: moverTab === "GAINERS" ? "rgba(232, 193, 119, 0.15)" : "transparent",
                      color: moverTab === "GAINERS" ? "var(--dash-primary)" : "var(--dash-on-surface-variant)",
                      border: moverTab === "GAINERS" ? "1px solid rgba(232, 193, 119, 0.3)" : "none",
                      borderRadius: "2px",
                    }}
                    onClick={() => setMoverTab("GAINERS")}
                  >
                    GAINERS
                  </button>
                  <button
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      backgroundColor: moverTab === "LOSERS" ? "rgba(255, 180, 171, 0.15)" : "transparent",
                      color: moverTab === "LOSERS" ? "var(--dash-error)" : "var(--dash-on-surface-variant)",
                      border: moverTab === "LOSERS" ? "1px solid rgba(255, 180, 171, 0.3)" : "none",
                      borderRadius: "2px",
                    }}
                    onClick={() => setMoverTab("LOSERS")}
                  >
                    LOSERS
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {INITIAL_MOVERS.map((mover) => (
                  <div
                    key={mover.symbol}
                    style={{
                      padding: "0.85rem 1.25rem",
                      borderBottom: "1px solid var(--dash-outline-variant)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className="logo-placeholder-sm">{mover.logo}</div>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 700 }}>{mover.symbol}</p>
                        <p style={{ fontSize: "9px", color: "var(--dash-on-surface-variant)" }}>{mover.name}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{mover.price}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: moverTab === "GAINERS" ? "var(--dash-primary)" : "var(--dash-error)" }}>
                        {moverTab === "GAINERS" ? mover.change : "-3.24%"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Row: Order Ledger | News & Earnings ─────────────────────── */}
          <div className="dashboard-grid-12">

            {/* Order History & Ledger (8 Cols) */}
            <div style={{ gridColumn: "span 8" }} className="bento-card">
              <div className="bento-card-header">
                <h3 className="bento-card-title">Order History &amp; Ledger</h3>
                <History size={16} style={{ color: "var(--dash-on-surface-variant)" }} />
              </div>

              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Asset / Type</th>
                    <th>Date</th>
                    <th>Amount / Units</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--dash-on-surface-variant)" }}>
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => {
                      const totalCost = tx.quantity * Number(tx.price);
                      const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <tr key={tx.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div className="logo-placeholder-sm" style={{ width: "24px", height: "24px", fontSize: "8px" }}>
                                {tx.symbol.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: "12px" }}>{tx.type} {tx.symbol}</p>
                                <p style={{ fontSize: "8px", color: tx.type === "BUY" ? "var(--dash-primary)" : "var(--dash-secondary)", textTransform: "uppercase" }}>
                                  {tx.type} Order
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--dash-on-surface-variant)" }}>
                            {formattedDate}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                            {Number(tx.quantity).toFixed(2)} SHRS
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", textAlign: "right" }}>
                            ${Number(tx.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", textAlign: "right", fontWeight: 700 }}>
                            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ padding: "0.15rem 0.4rem", backgroundColor: "rgba(232, 193, 119, 0.1)", border: "1px solid rgba(232, 193, 119, 0.2)", borderRadius: "2px", color: "var(--dash-primary)", fontSize: "8px", fontWeight: 700 }}>
                              EXECUTED
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* News & Earnings (4 Cols) */}
            <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Earnings Calendar */}
              <div className="bento-card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 className="bento-card-title">Earnings Calendar</h3>
                  <Calendar size={16} style={{ color: "var(--dash-on-surface-variant)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { month: "JUN", day: "12", ticker: "ORCL", timing: "After Market", eps: "$1.65", rev: "$14.5B" },
                    { month: "JUN", day: "15", ticker: "ADBE", timing: "After Market", eps: "$4.39", rev: "$5.2B" },
                  ].map((item) => (
                    <div key={item.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "var(--dash-surface-high)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "8px", color: "var(--dash-on-surface-variant)", textTransform: "uppercase" }}>{item.month}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1 }}>{item.day}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 700 }}>{item.ticker}</p>
                          <p style={{ fontSize: "9px", color: "var(--dash-on-surface-variant)", textTransform: "uppercase" }}>{item.timing}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>EPS Est: {item.eps}</p>
                        <p style={{ fontSize: "9px", color: "var(--dash-on-surface-variant)" }}>Rev: {item.rev}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Intelligence */}
              <div className="bento-card" style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 className="bento-card-title">Market Intelligence</h3>
                  <Newspaper size={16} style={{ color: "var(--dash-on-surface-variant)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                  {INITIAL_NEWS.map((news, idx) => (
                    <div key={idx} style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--dash-outline-variant)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "8px", color: "var(--dash-on-surface-variant)", textTransform: "uppercase" }}>
                          {news.source} • {news.time}
                        </span>
                        <span
                          style={{
                            fontSize: "7px",
                            fontWeight: 700,
                            padding: "0.1rem 0.3rem",
                            borderRadius: "2px",
                            textTransform: "uppercase",
                            backgroundColor: news.sentiment === "Positive" ? "rgba(232, 193, 119, 0.1)" : news.sentiment === "Negative" ? "rgba(255, 180, 171, 0.1)" : "rgba(255, 255, 255, 0.05)",
                            color: news.sentiment === "Positive" ? "var(--dash-primary)" : news.sentiment === "Negative" ? "var(--dash-error)" : "var(--dash-on-surface-variant)",
                          }}
                        >
                          {news.sentiment}
                        </span>
                      </div>
                      <p className="news-item-headline">{news.headline}</p>
                    </div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: "0.6rem", fontSize: "10px", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dash-on-surface-variant)", border: "none", borderTop: "1px solid var(--dash-outline-variant)", marginTop: "0.5rem", cursor: "pointer", background: "none" }}>
                  View All News
                </button>
              </div>
            </div>
          </div>

        </div>{/* end dashboard-inner */}
      </div>{/* end dashboard-root */}
    </div>
  );
}

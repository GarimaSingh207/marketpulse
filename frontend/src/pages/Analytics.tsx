import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import {
  Search,
  Bell,
  Briefcase,
  Maximize2,
  MoreVertical,
  Plus,
} from "lucide-react";
import "./Analytics.css";

interface PortfolioWithValue extends Portfolio {
  liveValue?: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<PortfolioWithValue[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "6M" | "1Y" | "MAX">("6M");

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setError(null);
      const portRes = await api.get<Portfolio[]>("/api/portfolios");
      const fetchedPortfolios = portRes.data;

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
      setError(err.response?.data?.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchAnalyticsData();
    const events = [
      "portfolio:created", "portfolio:deleted", "holding:created",
      "holding:deleted", "transaction:created", "portfolio:valueUpdated",
    ];
    events.forEach((e) => socket.on(e, handleUpdate));
    return () => events.forEach((e) => socket.off(e, handleUpdate));
  }, [socket, fetchAnalyticsData]);

  if (loading) return <Spinner text="Loading performance analytics…" />;

  const formattedTotalValue = totalValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Calculate dynamic top contributor from holdings
  let topContributorSymbol = "N/A";
  let topContributorName = "No active holdings";
  let topContributorGain = "$0.00";

  if (portfolios.length > 0) {
    let topHolding: { symbol: string; value: number } | null = null;
    for (const p of portfolios) {
      if (p.holdings) {
        for (const h of p.holdings) {
          const val = Number(h.quantity) * Number(h.averagePrice || 0);
          if (!topHolding || val > topHolding.value) {
            topHolding = { symbol: h.symbol, value: val };
          }
        }
      }
    }
    if (topHolding) {
      topContributorSymbol = topHolding.symbol;
      topContributorName = `${topHolding.symbol} Holding`;
      topContributorGain = `$${topHolding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  }

  return (
    <div className="analytics-root">
      {/* ── Top App Bar Header ───────────────────────────────────────────── */}
      <header className="analytics-appbar">
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div className="analytics-search-wrap">
            <Search size={16} className="analytics-search-icon" />
            <input
              type="text"
              className="analytics-search-input"
              placeholder="Global Search (CMD+K)"
              aria-label="Global Search"
            />
          </div>
          <nav className="analytics-nav-tabs">
            <Link to="/dashboard" className="analytics-nav-tab">Overview</Link>
            <span className="analytics-nav-tab active">Performance</span>
            <Link to="/portfolios" className="analytics-nav-tab">Positions</Link>
            <Link to="/watchlists" className="analytics-nav-tab">History</Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button style={{ background: "none", border: "none", color: "var(--analytics-on-surface-variant)", cursor: "pointer" }} aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid var(--analytics-outline-variant)", paddingLeft: "1.5rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
            <span className="font-data-md" style={{ color: "#10b981", fontSize: "11px", textTransform: "uppercase" }}>Live: NYSE</span>
          </div>
        </div>
      </header>

      {/* Welcome Heading */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--analytics-on-surface)" }}>
          Performance Analytics Workspace
        </h1>
        <p style={{ fontSize: "12px", color: "var(--analytics-on-surface-variant)", opacity: 0.7, marginTop: "2px" }}>
          Institutional Grade Attribution & Benchmark Analysis for {user?.name || "Trader"}
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ── 1. Optimized Performance Attribution Section ──────────────────────── */}
      <motion.section
        className="analytics-card hover-lift animate-entrance"
        style={{ marginBottom: "1.5rem", padding: "1.5rem" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h2 className="font-label-caps" style={{ color: "var(--analytics-on-surface-variant)", letterSpacing: "0.12em", marginBottom: "0.25rem" }}>
              Performance Attribution
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
              <span className="font-display-md" style={{ color: "var(--analytics-on-surface)" }}>
                ${formattedTotalValue}
              </span>
              <span className="font-data-lg" style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                +12.4% <span style={{ fontSize: "12px" }}>▲</span>
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
            <div className="timeframe-group">
              {(["1D", "1W", "1M", "6M", "1Y", "MAX"] as const).map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-btn ${timeframe === tf ? "active" : ""}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "12px", height: "2px", backgroundColor: "var(--analytics-primary)" }} />
                <span className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface)", opacity: 0.7 }}>Portfolio</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "12px", height: "2px", borderTop: "2px dashed var(--analytics-outline)" }} />
                <span className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)", opacity: 0.7 }}>S&amp;P 500 Index</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scaled Performance SVG Chart */}
        <div style={{ height: "300px", width: "100%", position: "relative", marginTop: "1rem" }}>
          <svg style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none" viewBox="0 0 1000 300">
            <defs>
              <linearGradient id="goldAttributionGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#e8c177" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#e8c177" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1="0" x2="1000" y1="40" y2="40" stroke="rgba(245, 245, 240, 0.05)" strokeWidth="1" />
            <line x1="0" x2="1000" y1="110" y2="110" stroke="rgba(245, 245, 240, 0.05)" strokeWidth="1" />
            <line x1="0" x2="1000" y1="180" y2="180" stroke="rgba(245, 245, 240, 0.05)" strokeWidth="1" />
            <line x1="0" x2="1000" y1="250" y2="250" stroke="rgba(245, 245, 240, 0.05)" strokeWidth="1" />
            {/* Benchmark (Dashed) */}
            <path d="M0,220 L100,210 L200,225 L300,195 L400,205 L500,190 L600,210 L700,200 L800,180 L900,165 L1000,175" fill="none" stroke="#9a8f80" strokeDasharray="6 4" strokeWidth="1.5" opacity="0.5" />
            {/* Portfolio Gradient Fill */}
            <path d="M0,280 L100,260 L200,210 L300,190 L400,150 L500,180 L600,130 L700,110 L800,80 L900,60 L1000,40 V300 H0 Z" fill="url(#goldAttributionGrad)" />
            {/* Main Portfolio Stroke */}
            <path d="M0,280 L100,260 L200,210 L300,190 L400,150 L500,180 L600,130 L700,110 L800,80 L900,60 L1000,40" fill="none" stroke="#e8c177" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pulsing latest point */}
            <circle cx="1000" cy="40" r="4" fill="#e8c177" />
          </svg>
        </div>
      </motion.section>

      {/* ── 2. Key Metrics & Benchmark Comparison Grid ────────────────────────── */}
      <div className="analytics-grid-12" style={{ marginBottom: "1.5rem" }}>
        {/* KPI Cards (8 Cols) */}
        <div style={{ gridColumn: "span 8", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {/* Card 1: Total Return */}
          <div className="analytics-card hover-lift animate-entrance" style={{ padding: "1.25rem" }}>
            <p className="font-label-caps" style={{ color: "var(--analytics-on-surface-variant)", marginBottom: "0.75rem" }}>
              Total Return (YTD)
            </p>
            <p className="font-data-lg" style={{ color: "#34d399" }}>+18.24%</p>
            <div style={{ marginTop: "1rem", width: "100%", backgroundColor: "var(--analytics-surface-low)", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "82%", height: "100%", backgroundColor: "#10b981", borderRadius: "2px" }} />
            </div>
          </div>

          {/* Card 2: Realized Gain/Loss */}
          <div className="analytics-card hover-lift animate-entrance" style={{ padding: "1.25rem" }}>
            <p className="font-label-caps" style={{ color: "var(--analytics-on-surface-variant)", marginBottom: "0.75rem" }}>
              Realized Gain/Loss
            </p>
            <p className="font-data-lg" style={{ color: "var(--analytics-on-surface)" }}>+$412,892.10</p>
            <p style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)", opacity: 0.6, marginTop: "1rem", textTransform: "uppercase" }}>
              Excl. Unrealized: $292.1k
            </p>
          </div>

          {/* Card 3: Max Drawdown */}
          <div className="analytics-card hover-lift animate-entrance" style={{ padding: "1.25rem" }}>
            <p className="font-label-caps" style={{ color: "var(--analytics-on-surface-variant)", marginBottom: "0.75rem" }}>
              Max Drawdown (30D)
            </p>
            <p className="font-data-lg" style={{ color: "var(--analytics-error)" }}>-4.12%</p>
            <p style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)", opacity: 0.6, marginTop: "1rem", textTransform: "uppercase" }}>
              Recovery: 12 Trading Days
            </p>
          </div>
        </div>

        {/* Benchmark Comparison (4 Cols) */}
        <div style={{ gridColumn: "span 4" }} className="analytics-card hover-lift animate-entrance">
          <div style={{ padding: "1.25rem", borderLeft: "3px solid var(--analytics-primary)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 className="font-label-caps" style={{ color: "var(--analytics-on-surface)", marginBottom: "1rem", letterSpacing: "0.1em" }}>
              Benchmark Comparison
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--analytics-on-surface-variant)" }}>Portfolio Cumulative</span>
                <span className="font-data-md" style={{ color: "#34d399" }}>+28.4%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--analytics-on-surface-variant)" }}>S&amp;P 500 Index</span>
                <span className="font-data-md" style={{ color: "var(--analytics-on-surface)" }}>+12.2%</span>
              </div>
            </div>

            <div className="hairline-divider" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-primary)" }}>Alpha (Relative)</p>
                <p className="font-display-md" style={{ fontSize: "24px", color: "var(--analytics-primary)", margin: 0 }}>+16.2%</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)" }}>Beta</p>
                <p className="font-data-md" style={{ fontSize: "14px" }}>1.08</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Performance Insights Workspace Grid ──────────────────────────── */}
      <div className="analytics-card" style={{ padding: "1.5rem", backgroundColor: "rgba(28, 27, 27, 0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 className="font-label-caps" style={{ color: "var(--analytics-on-surface)", letterSpacing: "0.15em" }}>
            Performance Insights Workspace
          </h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Maximize2 size={16} style={{ color: "var(--analytics-on-surface-variant)", cursor: "pointer" }} />
            <MoreVertical size={16} style={{ color: "var(--analytics-on-surface-variant)", cursor: "pointer" }} />
          </div>
        </div>

        <div className="analytics-grid-12">
          {/* Asset Allocation Donut (3 Cols) */}
          <div style={{ gridColumn: "span 3" }} className="analytics-card hover-lift">
            <div style={{ padding: "1.25rem" }}>
              <h3 className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)", marginBottom: "1rem" }}>
                Asset Allocation
              </h3>

              <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem 0" }}>
                <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1c1b1b" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e8c177" strokeWidth="3" strokeDasharray="65 35" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#c6c7c2" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-65" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#9a8f80" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-90" />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <span className="font-data-md" style={{ fontSize: "13px" }}>
                    {portfolios.length > 0 ? `${portfolios.length} Portfolios` : "3 Assets"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }} className="font-label-caps">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--analytics-primary)" }} /> EQUITIES
                  </span>
                  <span>65%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }} className="font-label-caps">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--analytics-tertiary)" }} /> FIXED INCOME
                  </span>
                  <span>25%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }} className="font-label-caps">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--analytics-outline)" }} /> CASH
                  </span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volatility Intensity Distribution (6 Cols) */}
          <div style={{ gridColumn: "span 6" }} className="analytics-card hover-lift">
            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)" }}>
                  Volatility Intensity (30D)
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="font-label-caps" style={{ fontSize: "9px", opacity: 0.6 }}>BULLISH</span>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <span style={{ width: "6px", height: "6px", backgroundColor: "rgba(16, 185, 129, 0.3)" }} />
                    <span style={{ width: "6px", height: "6px", backgroundColor: "rgba(16, 185, 129, 0.6)" }} />
                    <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }} />
                  </div>
                </div>
              </div>

              {/* Bar Chart Bars */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", gap: "4px" }}>
                {[40, 20, 70, 55, 35, 15, 90, 10, 45, 60, 30, 25, 80, 65, 50, 15, 85, 12, 40, 55].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      backgroundColor: i % 4 === 1 ? "rgba(255, 180, 171, 0.4)" : "rgba(16, 185, 129, 0.5)",
                      borderRadius: "1px",
                      transition: "transform 0.2s ease",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }} className="font-label-caps">
                <span style={{ fontSize: "9px", opacity: 0.4 }}>-30 DAYS</span>
                <span style={{ fontSize: "9px", opacity: 0.4 }}>T-0 (TODAY)</span>
              </div>
            </div>
          </div>

          {/* Sector Attribution & Best Performer (3 Cols) */}
          <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Sector Attribution */}
            <div className="analytics-card hover-lift" style={{ padding: "1.25rem" }}>
              <h3 className="font-label-caps" style={{ fontSize: "10px", color: "var(--analytics-on-surface-variant)", marginBottom: "1rem" }}>
                Sector Attribution
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--analytics-on-surface-variant)" }}>TECHNOLOGY</span>
                    <span style={{ color: "#34d399" }}>+22.4%</span>
                  </div>
                  <div className="sector-bar-bg"><div className="sector-bar-fill positive" style={{ width: "85%" }} /></div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--analytics-on-surface-variant)" }}>ENERGY</span>
                    <span style={{ color: "var(--analytics-error)" }}>-5.1%</span>
                  </div>
                  <div className="sector-bar-bg"><div className="sector-bar-fill negative" style={{ width: "25%" }} /></div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--analytics-on-surface-variant)" }}>FINANCIALS</span>
                    <span style={{ color: "#34d399" }}>+8.7%</span>
                  </div>
                  <div className="sector-bar-bg"><div className="sector-bar-fill positive" style={{ width: "55%" }} /></div>
                </div>
              </div>
            </div>

            {/* Top Contributor */}
            <div className="analytics-card hover-lift" style={{ padding: "1.25rem" }}>
              <h3 className="font-label-caps" style={{ fontSize: "10px", color: "#34d399", marginBottom: "0.75rem" }}>
                Top Contributor
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "32px", height: "32px", backgroundColor: "var(--analytics-surface-lowest)", border: "1px solid var(--analytics-outline-variant)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700 }}>
                    {topContributorSymbol.slice(0, 4)}
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600 }}>{topContributorName}</p>
                    <p style={{ fontSize: "9px", color: "var(--analytics-on-surface-variant)", opacity: 0.6 }}>ACTIVE ASSET</p>
                  </div>
                </div>
                <span className="font-data-md" style={{ color: "#34d399" }}>{topContributorGain}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Fallback when user has no portfolios */}
      {portfolios.length === 0 && !error && (
        <div style={{ marginTop: "2rem" }}>
          <EmptyState
            icon={<Briefcase size={24} />}
            title="No Active Portfolios Found"
            message="Create a portfolio to track real-time performance attribution and sector metrics."
            action={
              <Link to="/portfolios" className="dashboard-btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}>
                <Plus size={14} /> Create Portfolio
              </Link>
            }
          />
        </div>
      )}

      {/* Footer */}
      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2rem", marginTop: "2rem", borderTop: "1px solid var(--analytics-outline-variant)", opacity: 0.5 }}>
        <div className="font-label-caps" style={{ fontSize: "10px" }}>
          MarketPulse Performance Engine © 2026
        </div>
        <div className="font-data-md" style={{ fontSize: "10px", display: "flex", gap: "1rem" }}>
          <span style={{ color: "#10b981" }}>● API NOMINAL</span>
          <span>LATENCY: 14MS</span>
        </div>
      </footer>
    </div>
  );
}

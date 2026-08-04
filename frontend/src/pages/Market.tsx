import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import type { StockQuote } from "../types";
import ErrorBanner from "../components/ErrorBanner";
import StatCard from "../components/StatCard";
import { Search, History, TrendingUp, Sparkles, Plus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const POPULAR_TICKERS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN"];

export default function Market() {
  const [symbolInput, setSymbolInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("market_search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  const saveToHistory = (symbol: string) => {
    const updated = [symbol, ...history.filter((s) => s !== symbol)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("market_search_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("market_search_history");
  };

  const fetchQuote = async (symbol: string) => {
    setLoading(true);
    setError(null);
    setQuote(null);
    const formattedSymbol = symbol.trim().toUpperCase();

    try {
      const res = await api.get<StockQuote>(`/api/market/price/${formattedSymbol}`);
      setQuote(res.data);
      saveToHistory(formattedSymbol);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch quote for ${formattedSymbol}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    fetchQuote(symbolInput);
  };

  // Generate mock sparkline data around the current price for elite presentation
  const generateSparklineData = (price: number) => {
    const points = [0.97, 0.985, 0.96, 0.99, 1.015, 0.98, 1.00];
    return points.map((factor, idx) => ({
      time: `T${idx}`,
      price: Number((price * factor).toFixed(2)),
    }));
  };

  const sparklineData = quote ? generateSparklineData(quote.currentPrice) : [];

  return (
    <div className="section-gap">
      {/* Page Header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="page-title">Market Lookup</h1>
          <p className="page-subtitle">Real-time stock price feed backed by high-performance caching.</p>
        </div>
      </motion.div>

      {/* Main Search area */}
      <div className="two-col-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <form onSubmit={handleSubmit} className="market-search-wrap">
              <Search
                size={18}
                className="market-search-icon-left"
                aria-hidden="true"
              />
              <input
                id="marketSearchSymbol"
                type="text"
                className="market-search-input"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                placeholder="Search symbol (e.g. AAPL, NVDA)"
                required
                maxLength={10}
              />
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn btn-primary market-search-btn"
                disabled={loading}
              >
                {loading ? "Searching..." : "Lookup"}
              </motion.button>
            </form>

            {/* Quick chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem", alignItems: "center" }}>
              <span className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600, marginRight: "0.25rem" }}>
                POPULAR:
              </span>
              {POPULAR_TICKERS.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  className={`chip ${quote?.symbol === symbol ? "active" : ""}`}
                  onClick={() => {
                    setSymbolInput(symbol);
                    fetchQuote(symbol);
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </motion.div>

          {error && <ErrorBanner message={error} />}

          {/* Results Display */}
          <AnimatePresence mode="wait">
            {quote && (
              <motion.div
                key={quote.symbol}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="quote-card"
              >
                <div className="quote-card-header">
                  <div>
                    <span className="badge badge-accent" style={{ marginBottom: "0.5rem" }}>Live Feed</span>
                    <h2 className="quote-symbol">{quote.symbol}</h2>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                      LAST PRICE
                    </span>
                    <span className="quote-price">
                      ${quote.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <StatCard
                      label="Asset Identifier"
                      value={quote.symbol}
                      sub="Global market ticker"
                      icon={<Sparkles size={16} />}
                      iconVariant="accent"
                    />
                    <StatCard
                      label="Cached Price"
                      value={`$${quote.currentPrice.toFixed(2)}`}
                      sub="Auto-expires in 60s"
                      valueClass="text-profit mono"
                      icon={<TrendingUp size={16} />}
                      iconVariant="profit"
                    />
                  </div>

                  {/* Sparkline Graphic */}
                  <div className="card" style={{ padding: "1.25rem", background: "var(--bg-subtle)" }}>
                    <p className="stat-label" style={{ marginBottom: "1rem" }}>Interactive Price Trend (24h simulated)</p>
                    <div style={{ width: "100%", height: "100px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--profit)" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="var(--profit)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="var(--profit)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card"
          style={{ height: "fit-content" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <History size={16} className="text-muted" />
              <h3 className="card-title">Search History</h3>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearHistory}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "0.825rem" }}>No recent lookups</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {history.map((symbol) => (
                <button
                  key={symbol}
                  className="watchlist-tab"
                  onClick={() => {
                    setSymbolInput(symbol);
                    fetchQuote(symbol);
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{symbol}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    Re-check <Plus size={10} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

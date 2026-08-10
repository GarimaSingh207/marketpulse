import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import type { StockQuote } from "../types";
import ErrorBanner from "../components/ErrorBanner";
import StatCard from "../components/StatCard";
import {
  Search,
  History,
  TrendingUp,
  TrendingDown,
  Sparkles,
  LineChart,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import "./Market.css";

// Preset tickers for layout sections
const CAROUSEL_TICKERS = ["NVDA", "TSLA", "AMZN", "MSFT"];
const GAINERS_TICKERS = ["NVDA", "AMD", "TSLA"];
const LOSERS_TICKERS = ["AAPL", "BA", "GOOGL"];
const ACTIVE_TICKERS = ["MSFT", "AMZN", "META"];
const POPULAR_TICKERS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN"];

const ALL_TICKERS = Array.from(
  new Set([
    ...CAROUSEL_TICKERS,
    ...GAINERS_TICKERS,
    ...LOSERS_TICKERS,
    ...ACTIVE_TICKERS,
    ...POPULAR_TICKERS,
  ])
);

export default function Market() {
  const navigate = useNavigate();
  const [symbolInput, setSymbolInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<Record<string, StockQuote>>({});
  const [activeTab, setActiveTab] = useState<"TRENDING" | "Movers">("TRENDING");

  // Load search history and fetch all preset quotes on mount
  useEffect(() => {
    const saved = localStorage.getItem("market_search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // Ignore
      }
    }

    const fetchAllPrices = async () => {
      const dataMap: Record<string, StockQuote> = {};
      await Promise.all(
        ALL_TICKERS.map(async (sym) => {
          try {
            const res = await api.get<StockQuote>(`/api/market/price/${sym}`);
            dataMap[sym] = res.data;
          } catch {
            // Note: In case of API failure, we display an empty price structure (0)
            // indicating data is unavailable instead of generating fake prices.
            dataMap[sym] = {
              symbol: sym,
              currentPrice: 0,
            };
          }
        })
      );
      setMarketData(dataMap);
    };

    fetchAllPrices();
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
      // Update local cache map too
      setMarketData((prev) => ({ ...prev, [formattedSymbol]: res.data }));
    } catch (err: any) {
      setError(
        err.response?.data?.message || `Failed to fetch quote for ${formattedSymbol}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    fetchQuote(symbolInput);
  };

  // Sparkline data represents a flat visualization of the single currentPrice since historical prices are unavailable.
  const generateSparklineData = (price: number) => {
    return Array.from({ length: 7 }, (_, idx) => ({
      time: `T${idx}`,
      price: price,
    }));
  };

  const sparklineData = quote ? generateSparklineData(quote.currentPrice) : [];

  return (
    <div className="market-root mrkt-stagger-load">
      {/* 1. Header & Global Search Area */}
      <section className="mb-6">
        <h1 className="font-headline-sm text-2xl font-bold tracking-tight text-on-surface">
          Markets Workspace
        </h1>
        <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant mt-1 mb-6">
          Real-time institutional stock price feed and market overview.
        </p>

        <div className="relative max-w-4xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <form onSubmit={handleSubmit}>
            <input
              id="marketSearchSymbol"
              type="text"
              className="mrkt-search-input font-semibold rounded-t-sm"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="Search ticker symbol (e.g. AAPL, NVDA, TSLA)"
              required
              maxLength={10}
              disabled={loading}
            />
          </form>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-1.5 scale-75">
            <kbd className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded text-[10px] border border-outline-variant/30 tracking-widest font-mono">
              ENTER
            </kbd>
          </div>
        </div>

        {/* Filter Chips / Categories */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            className={`mrkt-filter-pill ${activeTab === "TRENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("TRENDING")}
          >
            Trending Tickers
          </button>
          <button
            className={`mrkt-filter-pill ${activeTab === "Movers" ? "active" : ""}`}
            onClick={() => setActiveTab("Movers")}
          >
            Market Movers
          </button>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* 2. Results Inline Lookup Panel */}
      <AnimatePresence mode="wait">
        {quote && (
          <motion.div
            key={quote.symbol}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mrkt-bento-card mb-8"
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="mrkt-ticker-badge text-primary">
                  {quote.symbol.slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">
                    {quote.symbol}
                  </h2>
                  <div className="flex items-center mt-1">
                    <span className="text-[10px] font-label-caps bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                      Live Feed
                    </span>
                    <button
                      className="text-[10px] font-label-caps bg-primary text-on-primary px-2.5 py-0.5 rounded-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity ml-3"
                      onClick={() => navigate(`/stock/${quote.symbol}`)}
                    >
                      Detailed Workspace →
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-on-surface-variant font-label-caps text-[9px] uppercase tracking-wider block">
                  LAST EXECUTED PRICE
                </span>
                <p className="text-3xl text-primary font-bold mrkt-text-mono mt-1">
                  ${quote.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-semibold mrkt-text-mono text-on-surface-variant">
                  Daily Change: N/A (API limited)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Asset Identifier"
                  value={quote.symbol}
                  sub="Global stock index"
                  icon={<Sparkles size={15} />}
                  iconVariant="accent"
                />
                <StatCard
                  label="Cached Quote"
                  value={`$${quote.currentPrice.toFixed(2)}`}
                  sub="Auto-expires in 60s"
                  valueClass="text-[#34d399] mrkt-text-mono"
                  icon={<TrendingUp size={15} />}
                  iconVariant="profit"
                />
              </div>

              {/* Sparkline trend representation */}
              <div className="mrkt-bento-card" style={{ background: "var(--mrkt-surface-low)" }}>
                <p className="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider mb-4">
                  24h Trend (Unavailable / Visual Placeholder Only)
                </p>
                <div style={{ width: "100%", height: "100px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--mrkt-primary)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--mrkt-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          background: "var(--mrkt-surface)",
                          border: "1px solid var(--mrkt-outline-variant)",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          color: "var(--mrkt-on-surface)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--mrkt-primary)"
                        strokeWidth={1}
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

      {/* 3. Market Overview Strip (All unavailable backend values set to N/A) */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-variant/10 py-4 px-6 rounded border border-outline-variant/10">
        <div>
          <span className="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-wider block mb-1">
            Fear &amp; Greed Index
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">N/A (Unavailable)</span>
        </div>
        <div>
          <span className="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-wider block mb-1">
            Volatility Index (VIX)
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">N/A (Unavailable)</span>
        </div>
        <div>
          <span className="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-wider block mb-1">
            Market Breadth
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">N/A (Unavailable)</span>
        </div>
        <div>
          <span className="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-wider block mb-1">
            A/D Ratio (S&amp;P 500)
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">N/A (Unavailable)</span>
        </div>
      </section>

      {/* 4. Trending Live Tickers Carousel */}
      <section className="mb-10">
        <h3 className="text-[11px] font-label-caps text-primary tracking-[0.2em] uppercase font-bold mb-4">
          Trending Live
        </h3>
        <div className="flex gap-4 overflow-x-auto mrkt-custom-scrollbar pb-3">
          {CAROUSEL_TICKERS.map((sym) => {
            const data = marketData[sym];
            const price = data ? data.currentPrice : 0;

            return (
              <motion.div
                key={sym}
                whileHover={{ y: -4, scale: 1.01 }}
                className="min-w-[280px] mrkt-bento-card group flex flex-col justify-between"
                onClick={() => {
                  navigate(`/stock/${sym}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="absolute inset-0 mrkt-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-zinc-900 border border-outline-variant/20 flex items-center justify-center text-primary font-bold text-[10px]">
                      {sym.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-none text-on-surface">{sym}</h4>
                      <p className="text-[9px] text-on-surface-variant mrkt-text-mono mt-0.5">
                        Ticker index
                      </p>
                    </div>
                  </div>
                  {/* Flat trend line visually representing lack of daily quote series */}
                  <svg className="w-12 h-6 overflow-visible" viewBox="0 0 100 40">
                    <path
                      d="M0,20 L100,20"
                      fill="none"
                      stroke="var(--mrkt-outline)"
                      strokeWidth="1.5"
                    ></path>
                  </svg>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="font-semibold text-sm mrkt-text-mono">
                      {price > 0 ? `$${price.toFixed(2)}` : "Unavailable"}
                    </p>
                    <p className="text-[10px] font-bold mrkt-text-mono text-on-surface-variant">
                      Change: N/A
                    </p>
                  </div>
                  <ArrowUpRight size={16} className="text-primary" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 5. Bento Columns Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Movers & News (col-span-9) */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {/* Movers Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gainers */}
              <div className="bg-surface-variant/10 border-t-2 border-[#34d399]/40 p-5 rounded-sm mrkt-bento-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-label-caps text-on-surface font-bold tracking-widest">
                    TOP GAINERS
                  </h3>
                  <LineChart size={14} className="text-[#34d399]" />
                </div>
                <div className="space-y-3">
                  {GAINERS_TICKERS.map((sym) => {
                    const price = marketData[sym]?.currentPrice || 0;

                    return (
                      <div
                        key={sym}
                        className="flex justify-between items-center group cursor-pointer hover:opacity-80"
                        onClick={() => {
                          navigate(`/stock/${sym}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-900 border border-outline-variant/10 rounded-sm text-[8px] font-bold flex items-center justify-center">
                            {sym.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold leading-none">{sym}</p>
                            <p className="text-[8px] text-on-surface-variant mrkt-text-mono mt-0.5">
                              Cap: N/A
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] mrkt-text-mono">
                            {price > 0 ? `$${price.toFixed(2)}` : "Unavailable"}
                          </p>
                          <p className="text-[9px] text-[#34d399] font-bold mrkt-text-mono">
                            Change: N/A
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Losers */}
              <div className="bg-surface-variant/10 border-t-2 border-error/40 p-5 rounded-sm mrkt-bento-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-label-caps text-on-surface font-bold tracking-widest">
                    TOP LOSERS
                  </h3>
                  <TrendingDown size={14} className="text-error" />
                </div>
                <div className="space-y-3">
                  {LOSERS_TICKERS.map((sym) => {
                    const price = marketData[sym]?.currentPrice || 0;

                    return (
                      <div
                        key={sym}
                        className="flex justify-between items-center group cursor-pointer hover:opacity-80"
                        onClick={() => {
                          navigate(`/stock/${sym}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-900 border border-outline-variant/10 rounded-sm text-[8px] font-bold flex items-center justify-center">
                            {sym.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold leading-none">{sym}</p>
                            <p className="text-[8px] text-on-surface-variant mrkt-text-mono mt-0.5">
                              Cap: N/A
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] mrkt-text-mono">
                            {price > 0 ? `$${price.toFixed(2)}` : "Unavailable"}
                          </p>
                          <p className="text-[9px] text-error font-bold mrkt-text-mono">
                            Change: N/A
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Most Active */}
              <div className="bg-surface-variant/10 border-t-2 border-primary/40 p-5 rounded-sm mrkt-bento-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-label-caps text-on-surface font-bold tracking-widest">
                    MOST ACTIVE
                  </h3>
                  <Activity size={14} className="text-primary" />
                </div>
                <div className="space-y-3">
                  {ACTIVE_TICKERS.map((sym) => {
                    const price = marketData[sym]?.currentPrice || 0;

                    return (
                      <div
                        key={sym}
                        className="flex justify-between items-center group cursor-pointer hover:opacity-80"
                        onClick={() => {
                          navigate(`/stock/${sym}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-900 border border-outline-variant/10 rounded-sm text-[8px] font-bold flex items-center justify-center">
                            {sym.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold leading-none">{sym}</p>
                            <p className="text-[8px] text-on-surface-variant mrkt-text-mono mt-0.5">
                              Vol: N/A
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] mrkt-text-mono">
                            {price > 0 ? `$${price.toFixed(2)}` : "Unavailable"}
                          </p>
                          <p className="text-[9px] text-on-surface-variant mrkt-text-mono">
                            Peak: N/A
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Intelligence Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider">
                Financial Intelligence
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-4 bg-surface-variant/20 border-l-2 border-primary mrkt-bento-card group cursor-pointer hover:bg-surface-variant/40 transition-colors">
                <div
                  className="w-20 h-20 bg-zinc-900 border border-outline-variant/10 shrink-0 rounded-sm"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ou1jduTS1hJW7zfBMwUo-xo3q0ujpxNZ55_83Dyn1_upS-id3lsucGYw5roxsZerpio1DCoXJiYCE6zJAtvTjWIthwWCbSQVATCkHUtCMcVXXoz60K9YRsIU4s1xAUtZdW6Xp533olN98Ec7UpRFxE6VnhOJ9B3sHAykrbZmhd3phgewA6aE_Km8MuvAFnSL8cHwBzRVnS3dv3VmKxjSKqxdpguHLlDRvEnqy1c3NbdlO43_yv2uMQ')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-label-caps px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 uppercase">
                      Markets
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-mono">14m ago</span>
                  </div>
                  <h4 className="font-bold text-xs mb-1 group-hover:text-primary transition-colors truncate text-on-surface">
                    FED Interest Rate Decision: Pricing Volatility
                  </h4>
                  <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                    Wall Street analysts remain divided as the Federal Reserve prepares for next
                    policy meeting...
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-surface-variant/20 border-l-2 border-transparent mrkt-bento-card group cursor-pointer hover:bg-surface-variant/40 transition-colors">
                <div
                  className="w-20 h-20 bg-zinc-900 border border-outline-variant/10 shrink-0 rounded-sm"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBmxo5Z5pKjpd6vWVXrqGp8uv_x1d3I6sIHinKLbQR1OY0jqPkoehCAKiuqStBXxrtmFzz50zdikHw4FRnQqWrLUtwaSugGnIWt2HAn-HIokLPcu4ZjWuLWwX5pgC0VzlK6uovhmgOKTNMHxyo86JFKXx5ekipYSzoxpSLFj2pt8xXkRS9MzkcP8YpnDcwOaMoLp8l-qCGwFWn-XbN_pjpUQ3L7o9bGX3Y-iP8HukE3wBgmZRwtkHkJMg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-label-caps px-1.5 py-0.5 bg-outline-variant/20 text-on-surface-variant border border-outline-variant/30 uppercase">
                      Tech
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-mono">42m ago</span>
                  </div>
                  <h4 className="font-bold text-xs mb-1 group-hover:text-primary transition-colors truncate text-on-surface">
                    Semiconductor Rally: AI Demand Hits Records
                  </h4>
                  <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                    Nvidia and AMD lead sector upward as cloud providers increase capital
                    expenditure for GPU clusters...
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Search Lookup History */}
          <section className="mrkt-bento-card">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <History size={16} className="text-primary" />
                <h3 className="font-label-caps text-xs text-on-surface font-semibold uppercase tracking-wider">
                  Search Ticker History
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  className="mrkt-filter-pill px-2.5 py-1 text-[9px]"
                  onClick={clearHistory}
                >
                  Clear Logs
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-6 text-center text-on-surface-variant text-xs">
                <p>No recent lookups recorded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {history.map((sym) => {
                  const price = marketData[sym]?.currentPrice || 0;

                  return (
                    <button
                      key={sym}
                      type="button"
                      className="bg-surface-variant/20 p-3 rounded-sm border border-outline-variant/10 text-left hover:border-primary/40 transition-colors flex justify-between items-center w-full"
                      onClick={() => {
                        navigate(`/stock/${sym}`);
                      }}
                    >
                      <div>
                        <p className="font-bold text-xs text-on-surface">{sym}</p>
                        <p className="text-[9px] text-on-surface-variant mrkt-text-mono mt-0.5">
                          {price > 0 ? `$${price.toFixed(2)}` : "Unavailable"}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold mrkt-text-mono text-on-surface-variant">
                        N/A
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Earnings & Analysts (col-span-3) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Earnings Calendar */}
          <div className="bg-surface-variant/10 p-5 rounded-sm mrkt-bento-card">
            <h3 className="text-[10px] font-label-caps text-primary tracking-[0.2em] mb-4 font-bold uppercase">
              Upcoming Earnings (Simulated / Placeholder)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 flex flex-col items-center justify-center border border-outline-variant/20 rounded-sm">
                    <span className="text-[7px] font-bold uppercase text-on-surface-variant">
                      JUN
                    </span>
                    <span className="text-[11px] font-bold leading-none text-on-surface">12</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface">ORCL</p>
                    <p className="text-[8px] text-on-surface-variant uppercase font-mono">
                      AMC Trade
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-on-surface">N/A</p>
                  <p className="text-[7px] text-on-surface-variant uppercase font-bold">EST EPS</p>
                </div>
              </div>

              <div className="mrkt-hairline opacity-30"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 flex flex-col items-center justify-center border border-outline-variant/20 rounded-sm">
                    <span className="text-[7px] font-bold uppercase text-on-surface-variant">
                      JUN
                    </span>
                    <span className="text-[11px] font-bold leading-none text-on-surface">15</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface">ADBE</p>
                    <p className="text-[8px] text-on-surface-variant uppercase font-mono">
                      BMO Trade
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-on-surface">N/A</p>
                  <p className="text-[7px] text-on-surface-variant uppercase font-bold">EST EPS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analyst Picks */}
          <div className="bg-surface-variant/10 p-5 rounded-sm mrkt-bento-card">
            <h3 className="text-[10px] font-label-caps text-primary tracking-[0.2em] mb-4 font-bold uppercase">
              Analyst Picks (Simulated / Placeholder)
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-primary/20 rounded-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[11px] font-bold text-on-surface">NVDA</p>
                  <span className="text-[7px] font-bold px-1.5 py-0.5 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 rounded-sm uppercase">
                    Strong Buy
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  GS raises PT to $1,100 citing infra strength.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 border border-outline-variant/10 rounded-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[11px] font-bold text-on-surface">AAPL</p>
                  <span className="text-[7px] font-bold px-1.5 py-0.5 bg-outline-variant/20 text-on-surface-variant border border-outline-variant/30 rounded-sm uppercase">
                    Neutral
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  JPM cautious on China headwinds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import type { StockQuote, Portfolio, Watchlist } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import {
  ArrowLeft,
  Activity,
  Star,
  Layers,
  BookOpen,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import "./StockDetails.css";

// Ticker metadata mapping for known premium displays
const STOCK_METADATA: Record<string, { name: string; sector: string; industry: string; ceo: string; hq: string; employees: string }> = {
  NVDA: {
    name: "NVIDIA Corp.",
    sector: "Technology",
    industry: "Semiconductors",
    ceo: "Jensen Huang",
    hq: "Santa Clara, CA",
    employees: "29,600",
  },
  MSFT: {
    name: "Microsoft Corp.",
    sector: "Technology",
    industry: "Software—Infrastructure",
    ceo: "Satya Nadella",
    hq: "Redmond, WA",
    employees: "221,000",
  },
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    ceo: "Tim Cook",
    hq: "Cupertino, CA",
    employees: "164,000",
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    ceo: "Elon Musk",
    hq: "Austin, TX",
    employees: "140,473",
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical",
    industry: "Internet Retail",
    ceo: "Andy Jassy",
    hq: "Seattle, WA",
    employees: "1,541,000",
  },
  GOOG: {
    name: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet Content & Information",
    ceo: "Sundar Pichai",
    hq: "Mountain View, CA",
    employees: "182,502",
  },
  META: {
    name: "Meta Platforms Inc.",
    sector: "Technology",
    industry: "Internet Content & Information",
    ceo: "Mark Zuckerberg",
    hq: "Menlo Park, CA",
    employees: "67,317",
  },
  NFLX: {
    name: "Netflix Inc.",
    sector: "Communication",
    industry: "Entertainment",
    ceo: "Ted Sarandos / Greg Peters",
    hq: "Los Gatos, CA",
    employees: "13,000",
  },
};

export default function StockDetails() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watchlist integration state
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistSubmitting, setWatchlistSubmitting] = useState<string | null>(null);

  // Quick Trade integration state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeQty, setTradeQty] = useState("");
  const [tradePrice, setTradePrice] = useState("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "FINANCIALS" | "ORDER_BOOK" | "NEWS">("OVERVIEW");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");

  const formattedSymbol = (symbol || "").trim().toUpperCase();
  const meta = STOCK_METADATA[formattedSymbol] || {
    name: `${formattedSymbol} Corporation`,
    sector: "N/A",
    industry: "N/A",
    ceo: "N/A",
    hq: "N/A",
    employees: "N/A",
  };

  const fetchQuote = useCallback(async () => {
    if (!formattedSymbol) return;
    try {
      setError(null);
      const res = await api.get<StockQuote>(`/api/market/price/${formattedSymbol}`);
      setQuote(res.data);
      if (res.data && !tradePrice) {
        setTradePrice(res.data.currentPrice.toString());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to load market data for ${formattedSymbol}.`);
    } finally {
      setLoading(false);
    }
  }, [formattedSymbol, tradePrice]);

  const fetchUserData = useCallback(async () => {
    try {
      const [watchlistsRes, portfoliosRes] = await Promise.all([
        api.get<Watchlist[]>("/api/watchlists"),
        api.get<Portfolio[]>("/api/portfolios"),
      ]);
      setWatchlists(watchlistsRes.data);
      setPortfolios(portfoliosRes.data);
      if (portfoliosRes.data.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfoliosRes.data[0].id);
      }
    } catch {
      // Fail silently for user details
    }
  }, [selectedPortfolioId]);

  useEffect(() => {
    fetchQuote();
    fetchUserData();
  }, [formattedSymbol]);

  // Handle watchlists toggle add/remove
  const handleWatchlistToggle = async (watchlistId: string, isInList: boolean) => {
    setWatchlistSubmitting(watchlistId);
    try {
      if (isInList) {
        await api.delete(`/api/watchlists/${watchlistId}/stocks/${formattedSymbol}`);
      } else {
        await api.post(`/api/watchlists/${watchlistId}/stocks`, { symbol: formattedSymbol });
      }
      // Re-fetch watchlists
      const res = await api.get<Watchlist[]>("/api/watchlists");
      setWatchlists(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update watchlist.");
    } finally {
      setWatchlistSubmitting(null);
    }
  };

  // Handle quick trade submit
  const handleTradeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId || !tradeQty || !tradePrice) return;

    setTradeSubmitting(true);
    setTradeSuccess(null);
    setTradeError(null);

    const qty = parseFloat(tradeQty);
    const price = parseFloat(tradePrice);

    if (isNaN(qty) || qty <= 0) {
      setTradeError("Please enter a valid quantity.");
      setTradeSubmitting(false);
      return;
    }

    try {
      const selectedPort = portfolios.find((p) => p.id === selectedPortfolioId);
      if (!selectedPort) {
        setTradeError("Selected portfolio was not found.");
        setTradeSubmitting(false);
        return;
      }

      const existingHolding = selectedPort.holdings?.find(
        (h) => h.symbol.toUpperCase() === formattedSymbol
      );

      if (tradeType === "BUY") {
        if (existingHolding) {
          // Add transaction to existing holding
          await api.post(`/api/holdings/${existingHolding.id}/transactions`, {
            type: "BUY",
            quantity: qty,
            price: price,
          });
        } else {
          // Add brand new holding
          await api.post(`/api/portfolios/${selectedPortfolioId}/holdings`, {
            symbol: formattedSymbol,
            quantity: qty,
            averagePrice: price,
          });
        }
        setTradeSuccess(`Successfully bought ${qty} shares of ${formattedSymbol}.`);
      } else {
        // SELL transaction
        if (!existingHolding) {
          setTradeError(`You do not own ${formattedSymbol} in the selected portfolio.`);
          setTradeSubmitting(false);
          return;
        }

        if (qty > existingHolding.quantity) {
          setTradeError(`Cannot sell ${qty} units. Only ${existingHolding.quantity} available.`);
          setTradeSubmitting(false);
          return;
        }

        await api.post(`/api/holdings/${existingHolding.id}/transactions`, {
          type: "SELL",
          quantity: qty,
          price: price,
        });
        setTradeSuccess(`Successfully sold ${qty} shares of ${formattedSymbol}.`);
      }

      setTradeQty("");
      // Re-fetch portfolio data to update lists
      const portRes = await api.get<Portfolio[]>("/api/portfolios");
      setPortfolios(portRes.data);
    } catch (err: any) {
      setTradeError(err.response?.data?.message || "Trade execution failed.");
    } finally {
      setTradeSubmitting(false);
    }
  };

  if (loading) return <Spinner text={`Fetching ${formattedSymbol} workspace…`} />;
  if (error || !quote) return <ErrorBanner message={error || "Stock details unavailable."} />;

  return (
    <div className="stock-details-root stock-stagger-load">
      {/* Back Button */}
      <Link to="/market" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to Markets
      </Link>

      {/* Header Info Area */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-outline-variant/10 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-on-surface tracking-tight">{meta.name}</h1>
            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-mono text-xs border border-outline-variant/20 rounded-sm">
              {quote.symbol}: NASDAQ
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/20">
              <span className="stock-pulse-dot"></span>
              <span className="text-[9px] font-bold text-primary tracking-widest uppercase">Live Feed</span>
            </div>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-4xl font-bold text-on-surface font-mono tracking-tight">
              ${quote.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold font-mono text-on-surface-variant/60">
              Daily Change: N/A (Unavailable)
            </span>
          </div>
        </div>
      </section>

      {/* Main Asymmetrical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Chart & Tabs (8-cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Custom Tabs Navigation */}
          <div className="stock-tabs-header">
            <button
              className={`stock-tab-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
              onClick={() => setActiveTab("OVERVIEW")}
            >
              Overview &amp; Chart
            </button>
            <button
              className={`stock-tab-btn ${activeTab === "FINANCIALS" ? "active" : ""}`}
              onClick={() => setActiveTab("FINANCIALS")}
            >
              Financials
            </button>
            <button
              className={`stock-tab-btn ${activeTab === "ORDER_BOOK" ? "active" : ""}`}
              onClick={() => setActiveTab("ORDER_BOOK")}
            >
              Order Book
            </button>
            <button
              className={`stock-tab-btn ${activeTab === "NEWS" ? "active" : ""}`}
              onClick={() => setActiveTab("NEWS")}
            >
              News Feed
            </button>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activeTab === "OVERVIEW" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Visual Chart Placeholder */}
                <div className="stock-bento-card">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4 mb-4">
                    <div className="flex gap-1.5">
                      {["1D", "5D", "1M", "6M", "1Y", "MAX"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-3 py-1 text-[10px] font-semibold rounded-sm transition-colors ${
                            selectedTimeframe === tf
                              ? "bg-primary/10 text-primary border-b-2 border-primary"
                              : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/40 font-mono">
                      Feed: Real-time price stream
                    </span>
                  </div>
                  
                  {/* Empty Chart State */}
                  <div className="stock-chart-unavailable-box">
                    <Activity size={28} className="text-outline/30 mb-2" />
                    <h4 className="font-semibold text-xs text-on-surface uppercase tracking-wider">
                      Historical Chart Data Unavailable
                    </h4>
                    <p className="text-[11px] text-on-surface-variant/60 max-w-sm mt-2 leading-relaxed">
                      Only real-time quotes are currently served by the backend API. Historical series data is not integrated.
                    </p>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div>
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">
                    Key Statistics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-variant/10 border border-outline-variant/10">
                    {[
                      { label: "MARKET CAP", value: "N/A" },
                      { label: "P/E RATIO", value: "N/A" },
                      { label: "EPS", value: "N/A" },
                      { label: "DIV YIELD", value: "N/A" },
                      { label: "52W HIGH", value: "N/A" },
                      { label: "52W LOW", value: "N/A" },
                      { label: "AVG VOLUME", value: "N/A" },
                      { label: "BETA", value: "N/A" },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-surface p-4 flex flex-col justify-center h-20">
                        <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-lg font-bold font-mono text-on-surface mt-0.5">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Profile Details */}
                <div className="stock-bento-card">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-6">
                    Company Intelligence
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-primary border-b border-primary/20 pb-2 uppercase">
                        Overview
                      </p>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-4">
                        <div>
                          <span className="text-[9px] font-bold text-on-surface-variant/40 block">SECTOR</span>
                          <span className="text-xs text-on-surface">{meta.sector}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-on-surface-variant/40 block">INDUSTRY</span>
                          <span className="text-xs text-on-surface">{meta.industry}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-on-surface-variant/40 block">CEO</span>
                          <span className="text-xs text-on-surface">{meta.ceo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-on-surface-variant/40 block">HQ</span>
                          <span className="text-xs text-on-surface">{meta.hq}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-on-surface-variant/40 block">EMPLOYEES</span>
                          <span className="text-xs text-on-surface">{meta.employees}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary border-b border-primary/20 pb-2 uppercase">
                        Intel Profile
                      </p>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-4">
                        This asset is parsed under Nasdaq markets. Full business summaries, officer descriptions, and legal profiles are currently unavailable through the active data endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "FINANCIALS" && (
              <motion.div
                key="financials"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="stock-bento-card"
              >
                <div className="py-12 text-center text-on-surface-variant">
                  <Layers size={32} className="mx-auto mb-3 opacity-30 text-primary animate-pulse" />
                  <h4 className="font-semibold text-sm text-on-surface uppercase tracking-wider">
                    Financial Statements Unavailable
                  </h4>
                  <p className="text-xs text-on-surface-variant/60 max-w-sm mx-auto mt-2 leading-relaxed">
                    Balance sheet ratios, quarterly earnings filings, and income metrics are not provided by the active market database API.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "ORDER_BOOK" && (
              <motion.div
                key="order_book"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="stock-bento-card"
              >
                <div className="py-12 text-center text-on-surface-variant">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-30 text-primary animate-pulse" />
                  <h4 className="font-semibold text-sm text-on-surface uppercase tracking-wider">
                    Order Book Stream Unavailable
                  </h4>
                  <p className="text-xs text-on-surface-variant/60 max-w-sm mx-auto mt-2 leading-relaxed">
                    Level 2 depth bid-ask queue streaming is currently disabled. Active backend routes do not support order book buffers.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "NEWS" && (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="stock-bento-card"
              >
                <div className="py-12 text-center text-on-surface-variant">
                  <Activity size={32} className="mx-auto mb-3 opacity-30 text-primary animate-pulse" />
                  <h4 className="font-semibold text-sm text-on-surface uppercase tracking-wider">
                    No Recent Corporate News Articles
                  </h4>
                  <p className="text-xs text-on-surface-variant/60 max-w-sm mx-auto mt-2 leading-relaxed">
                    There are no news syndicates connected to the market service. Press releases are unavailable.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Trade, Watchlists, Sentiment (4-cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Trade Workspace */}
          <div className="stock-trade-panel">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/10">
              <Briefcase size={16} className="text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Quick Trade
              </h3>
            </div>

            {tradeSuccess && (
              <div className="mb-4 p-2 bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] text-xs rounded">
                {tradeSuccess}
              </div>
            )}
            {tradeError && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded">
                {tradeError}
              </div>
            )}

            {portfolios.length === 0 ? (
              <div className="text-xs text-on-surface-variant/60 py-4 text-center">
                Please create a portfolio first from the Portfolio page before executing trades.
              </div>
            ) : (
              <form onSubmit={handleTradeSubmit} className="space-y-4">
                {/* Buy / Sell Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-lowest rounded">
                  <button
                    type="button"
                    onClick={() => setTradeType("BUY")}
                    className={`py-1.5 text-xs font-bold transition-all rounded-sm ${
                      tradeType === "BUY"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType("SELL")}
                    className={`py-1.5 text-xs font-bold transition-all rounded-sm ${
                      tradeType === "SELL"
                        ? "bg-red-500 text-white"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                 {/* Portfolio Selector */}
                <div>
                  <label htmlFor="selectPortfolio" className="text-[10px] font-bold text-on-surface-variant/60 block mb-1.5">
                    SELECT PORTFOLIO
                  </label>
                  <select
                    id="selectPortfolio"
                    className="stock-input-field text-xs"
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  >
                    {portfolios.map((p) => {
                      const holding = p.holdings?.find(
                        (h) => h.symbol.toUpperCase() === formattedSymbol
                      );
                      const holdingStr = holding ? ` (${holding.quantity} owned)` : "";
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name}{holdingStr}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label htmlFor="tradeQuantity" className="text-[10px] font-bold text-on-surface-variant/60 block mb-1.5">
                    QUANTITY
                  </label>
                  <input
                    id="tradeQuantity"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Enter amount"
                    className="stock-input-field text-xs font-mono"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    required
                  />
                </div>

                {/* Limit Price Input */}
                <div>
                  <label htmlFor="tradePrice" className="text-[10px] font-bold text-on-surface-variant/60 block mb-1.5">
                    LIMIT PRICE ($)
                  </label>
                  <input
                    id="tradePrice"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Limit price"
                    className="stock-input-field text-xs font-mono"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    required
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={tradeSubmitting}
                  className={`w-full py-2.5 rounded-sm text-xs font-bold transition-all ${
                    tradeType === "BUY"
                      ? "bg-primary text-on-primary hover:opacity-90"
                      : "bg-red-500 text-white hover:opacity-90"
                  } disabled:opacity-50`}
                >
                  {tradeSubmitting ? "Executing..." : `${tradeType} ${formattedSymbol}`}
                </button>
              </form>
            )}
          </div>

          {/* Watchlists Add/Remove Panel */}
          <div className="stock-bento-card">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/10">
              <Star size={16} className="text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Watchlist Actions
              </h3>
            </div>
            
            {watchlists.length === 0 ? (
              <p className="text-xs text-on-surface-variant/60 text-center py-2">
                No watchlists created yet.
              </p>
            ) : (
              <div className="space-y-3">
                {watchlists.map((wl) => {
                  const isInList = wl.stocks.some(
                    (s) => s.symbol.toUpperCase() === formattedSymbol
                  );
                  const isPending = watchlistSubmitting === wl.id;

                  return (
                    <div
                      key={wl.id}
                      className="flex justify-between items-center bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/5"
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface">{wl.name}</p>
                        <p className="text-[9px] text-on-surface-variant/60 font-mono mt-0.5">
                          {wl.stocks.length} assets tracked
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleWatchlistToggle(wl.id, isInList)}
                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-sm text-[10px] font-bold transition-all ${
                          isInList
                            ? "bg-primary/10 border-primary text-primary hover:bg-transparent"
                            : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        <Star size={10} fill={isInList ? "currentColor" : "none"} />
                        <span>{isInList ? "Tracked" : "Track"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sentiment Analysis Panel */}
          <div className="stock-bento-card">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/10">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Sentiment Target
              </h3>
            </div>
            <div className="text-center py-4">
              <p className="text-[10px] font-bold text-on-surface-variant/40 tracking-wider">
                ANALYST CONSENSUS
              </p>
              <p className="text-2xl font-bold font-mono text-on-surface-variant/60 mt-1">
                N/A
              </p>
              <p className="text-[10px] text-on-surface-variant/40 mt-1">
                Sentiment indicators are currently unavailable.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

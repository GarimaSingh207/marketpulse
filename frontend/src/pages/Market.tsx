import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import type { StockQuote } from "../types";
import ErrorBanner from "../components/ErrorBanner";
import StatCard from "../components/StatCard";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import "./Market.css";

// Preset tickers for layout sections
const CAROUSEL_TICKERS = ["NVDA", "TSLA", "AMZN", "RELIANCE.NS"];
const GAINERS_TICKERS = ["NVDA", "TSLA", "AMD"];
const LOSERS_TICKERS = ["AAPL", "BA", "GOOGL"];
const ACTIVE_TICKERS = ["MSFT", "AMZN", "META"];
const RECENTLY_VIEWED_TICKERS = ["MSFT", "GOOGL", "TCS.NS", "AAPL"];

const ALL_TICKERS = Array.from(
  new Set([
    ...CAROUSEL_TICKERS,
    ...GAINERS_TICKERS,
    ...LOSERS_TICKERS,
    ...ACTIVE_TICKERS,
    ...RECENTLY_VIEWED_TICKERS,
  ])
);

const CAROUSEL_DATA: Record<string, { name: string; abbr: string; price: string; change: string; positive: boolean; path: string }> = {
  "NVDA":        { name: "Nvidia Corp.", abbr: "NV", price: "$875.28",    change: "+4.12%", positive: true,  path: "M0,35 Q10,25 20,30 T40,15 T60,20 T80,5 T100,10" },
  "TSLA":        { name: "Tesla, Inc.",  abbr: "TS", price: "$171.05",    change: "+2.84%", positive: true,  path: "M0,30 Q10,35 20,25 T40,30 T60,15 T80,20 T100,12" },
  "AMZN":        { name: "Amazon.com",  abbr: "AM", price: "$178.15",    change: "-0.42%", positive: false, path: "M0,20 Q10,10 20,15 T40,25 T60,35 T80,30 T100,38" },
  "RELIANCE.NS": { name: "Reliance Ind.", abbr: "RE", price: "₹2,985.40", change: "+1.45%", positive: true,  path: "M0,35 Q20,30 40,25 T60,20 T80,10 T100,5" },
};

const GAINERS_DATA: Record<string, { abbr: string; price: string; change: string; sub: string }> = {
  "NVDA": { abbr: "NV", price: "875.28", change: "+4.12%", sub: "Cap: $2.1T" },
  "TSLA": { abbr: "TS", price: "171.05", change: "+2.84%", sub: "Vol: 102M"  },
  "AMD":  { abbr: "AM", price: "193.45", change: "+1.92%", sub: "Vol: 88M"   },
};

const LOSERS_DATA: Record<string, { abbr: string; price: string; change: string; sub: string }> = {
  "AAPL":  { abbr: "AP", price: "172.62", change: "-1.15%", sub: "Cap: $2.6T" },
  "BA":    { abbr: "BA", price: "182.49", change: "-0.98%", sub: "Vol: 14M"   },
  "GOOGL": { abbr: "GO", price: "142.65", change: "-0.45%", sub: "Cap: $1.8T" },
};

const ACTIVE_DATA: Record<string, { abbr: string; price: string; peak: string; sub: string }> = {
  "MSFT": { abbr: "MS", price: "415.50", peak: "427.10 Peak", sub: "Vol: 24.2M" },
  "AMZN": { abbr: "AZ", price: "178.15", peak: "180.12 Peak", sub: "Vol: 18.5M" },
  "META": { abbr: "ME", price: "496.24", peak: "510.45 Peak", sub: "Vol: 15.1M" },
};

const RECENTLY_DATA: Record<string, { abbr: string; change: string; positive: boolean }> = {
  "MSFT":   { abbr: "MS", change: "+1.2%", positive: true  },
  "GOOGL":  { abbr: "GO", change: "-0.4%", positive: false },
  "TCS.NS": { abbr: "TC", change: "+0.8%", positive: true  },
  "AAPL":   { abbr: "AP", change: "-1.1%", positive: false },
};

const FILTER_CHIPS = ["TRENDING", "MOST ACTIVE", "TOP GAINERS", "TOP LOSERS", "US MARKET", "INDIA", "TECH"];

export default function Market() {
  const navigate = useNavigate();
  const [symbolInput, setSymbolInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_marketData, setMarketData] = useState<Record<string, StockQuote>>({}); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [activeChip, setActiveChip] = useState("TRENDING");

  useEffect(() => {
    const fetchAllPrices = async () => {
      const dataMap: Record<string, StockQuote> = {};
      await Promise.all(
        ALL_TICKERS.map(async (sym) => {
          try {
            const res = await api.get<StockQuote>(`/api/market/price/${sym}`);
            dataMap[sym] = res.data;
          } catch {
            dataMap[sym] = { symbol: sym, currentPrice: 0 };
          }
        })
      );
      setMarketData(dataMap);
    };
    fetchAllPrices();
  }, []);

  const fetchQuote = async (symbol: string) => {
    setLoading(true);
    setError(null);
    setQuote(null);
    const fmt = symbol.trim().toUpperCase();
    try {
      const res = await api.get<StockQuote>(`/api/market/price/${fmt}`);
      setQuote(res.data);
      setMarketData((prev) => ({ ...prev, [fmt]: res.data }));
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch quote for ${fmt}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    fetchQuote(symbolInput);
  };

  const generateSparklineData = (price: number) =>
    Array.from({ length: 7 }, (_, idx) => ({ time: `T${idx}`, price }));

  const sparklineData = quote ? generateSparklineData(quote.currentPrice) : [];

  return (
    <div className="market-root mrkt-stagger-load">

      {/* ── Search & Filter ── */}
      <section className="mrkt-search-section">
        <div className="mrkt-search-wrap">
          <span className="mrkt-search-icon"><Search size={22} /></span>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <input
              id="marketSearchSymbol"
              type="text"
              className="mrkt-search-input"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="Search Symbol (e.g. AAPL, NVDA, RELIANCE.NS)"
              maxLength={15}
              disabled={loading}
            />
          </form>
          <div className="mrkt-kbd-hint">
            <kbd className="mrkt-kbd">CMD</kbd>
            <kbd className="mrkt-kbd">K</kbd>
          </div>
        </div>

        <div className="mrkt-filter-chips">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              className={`mrkt-filter-pill${activeChip === chip ? " active" : ""}`}
              onClick={() => setActiveChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* ── Inline Quote Result ── */}
      <AnimatePresence mode="wait">
        {quote && (
          <motion.div
            key={quote.symbol}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mrkt-bento-card mrkt-quote-panel"
          >
            <div className="mrkt-quote-header">
              <div className="mrkt-quote-left">
                <div className="mrkt-ticker-badge">{quote.symbol.slice(0, 2)}</div>
                <div>
                  <h2 className="mrkt-quote-symbol">{quote.symbol}</h2>
                  <div className="mrkt-quote-badges">
                    <span className="mrkt-live-badge">Live Feed</span>
                    <button className="mrkt-detail-btn" onClick={() => navigate(`/stock/${quote.symbol}`)}>
                      Detailed Workspace →
                    </button>
                  </div>
                </div>
              </div>
              <div className="mrkt-quote-right">
                <span className="mrkt-quote-label">LAST EXECUTED PRICE</span>
                <p className="mrkt-quote-price mrkt-text-mono">
                  ${quote.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="mrkt-quote-sub mrkt-text-mono">Daily Change: N/A (API limited)</span>
              </div>
            </div>

            <div className="mrkt-quote-grid">
              <div className="mrkt-stat-pair">
                <StatCard label="Asset Identifier" value={quote.symbol} sub="Global stock index" icon={<Sparkles size={15} />} iconVariant="accent" />
                <StatCard label="Cached Quote" value={`$${quote.currentPrice.toFixed(2)}`} sub="Auto-expires in 60s" valueClass="mrkt-text-mono" icon={<TrendingUp size={15} />} iconVariant="profit" />
              </div>
              <div className="mrkt-bento-card mrkt-sparkline-card">
                <p className="mrkt-sparkline-label">24h Trend (Unavailable / Visual Placeholder Only)</p>
                <div style={{ width: "100%", height: "100px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--mrkt-primary)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--mrkt-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: "var(--mrkt-surface)", border: "1px solid var(--mrkt-outline-variant)", borderRadius: "4px", fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--mrkt-on-surface)" }} />
                      <Area type="monotone" dataKey="price" stroke="var(--mrkt-primary)" strokeWidth={1} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Market Overview Strip ── */}
      <section className="mrkt-overview-strip">
        <div className="mrkt-overview-item">
          <span className="mrkt-overview-label">Fear &amp; Greed</span>
          <div className="mrkt-fear-greed">
            <div className="mrkt-fear-bar"><div className="mrkt-fear-fill" style={{ width: "68%" }} /></div>
            <span className="mrkt-fear-value">68 (Greed)</span>
          </div>
        </div>
        <div className="mrkt-overview-divider" />
        <div className="mrkt-overview-item">
          <span className="mrkt-overview-label">VIX</span>
          <span className="mrkt-overview-vix mrkt-text-mono">12.85 <span className="mrkt-overview-sub">(-2.4%)</span></span>
        </div>
        <div className="mrkt-overview-divider" />
        <div className="mrkt-overview-item">
          <span className="mrkt-overview-label">Breadth</span>
          <span className="mrkt-overview-neutral mrkt-text-mono">62% Bullish</span>
        </div>
        <div className="mrkt-overview-divider" />
        <div className="mrkt-overview-item">
          <span className="mrkt-overview-label">A/D Ratio</span>
          <span className="mrkt-overview-neutral mrkt-text-mono">2.41</span>
        </div>
      </section>

      {/* ── Trending Live Carousel ── */}
      <section className="mrkt-section">
        <div className="mrkt-section-header">
          <h3 className="mrkt-section-title">Trending Live</h3>
          <div className="mrkt-nav-arrows">
            <button className="mrkt-nav-btn"><ChevronLeft size={14} /></button>
            <button className="mrkt-nav-btn"><ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="mrkt-carousel-track">
          {CAROUSEL_TICKERS.map((sym) => {
            const info = CAROUSEL_DATA[sym];
            if (!info) return null;
            return (
              <motion.div
                key={sym}
                whileHover={{ y: -2 }}
                className="mrkt-carousel-card group"
                onClick={() => navigate(`/stock/${sym}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="mrkt-shimmer-overlay mrkt-shimmer" />
                <div className="mrkt-carousel-top">
                  <div className="mrkt-carousel-info">
                    <div className="mrkt-sym-badge">{info.abbr}</div>
                    <div>
                      <h4 className="mrkt-card-name">{info.name}</h4>
                      <p className="mrkt-card-ticker mrkt-text-mono">{sym}</p>
                    </div>
                  </div>
                  <svg className="mrkt-sparkline-svg" viewBox="0 0 100 40">
                    <path d={info.path} fill="none" stroke={info.positive ? "#e8c177" : "#ffb4ab"} strokeWidth="2" />
                  </svg>
                </div>
                <div className="mrkt-carousel-bottom">
                  <div>
                    <p className="mrkt-card-price mrkt-text-mono">{info.price}</p>
                    <p className={`mrkt-card-change ${info.positive ? "mrkt-pos" : "mrkt-neg"}`}>{info.change}</p>
                  </div>
                  <ArrowUpRight size={16} className={info.positive ? "mrkt-icon-primary" : "mrkt-icon-muted"} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <div className="mrkt-bento-grid">

        {/* Left Column */}
        <div className="mrkt-left-col">

          {/* Market Movers */}
          <section>
            <div className="mrkt-movers-grid">
              {/* Top Gainers */}
              <div className="mrkt-movers-card mrkt-gainers-border">
                <div className="mrkt-movers-header">
                  <h3 className="mrkt-movers-title">TOP GAINERS</h3>
                  <TrendingUp size={14} className="mrkt-icon-green" />
                </div>
                <div className="mrkt-movers-list">
                  {GAINERS_TICKERS.map((sym, i) => {
                    const info = GAINERS_DATA[sym];
                    if (!info) return null;
                    return (
                      <div key={sym}>
                        <div className="mrkt-mover-row" onClick={() => navigate(`/stock/${sym}`)}>
                          <div className="mrkt-mover-left">
                            <div className="mrkt-mini-badge">{info.abbr}</div>
                            <div>
                              <p className="mrkt-mover-sym">{sym}</p>
                              <p className="mrkt-mover-sub mrkt-text-mono">{info.sub}</p>
                            </div>
                          </div>
                          <div className="mrkt-mover-right">
                            <p className="mrkt-mover-price mrkt-text-mono">{info.price}</p>
                            <p className="mrkt-mover-change mrkt-pos">{info.change}</p>
                          </div>
                        </div>
                        {i < GAINERS_TICKERS.length - 1 && <div className="mrkt-hairline" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Losers */}
              <div className="mrkt-movers-card mrkt-losers-border">
                <div className="mrkt-movers-header">
                  <h3 className="mrkt-movers-title">TOP LOSERS</h3>
                  <TrendingDown size={14} className="mrkt-icon-red" />
                </div>
                <div className="mrkt-movers-list">
                  {LOSERS_TICKERS.map((sym, i) => {
                    const info = LOSERS_DATA[sym];
                    if (!info) return null;
                    return (
                      <div key={sym}>
                        <div className="mrkt-mover-row" onClick={() => navigate(`/stock/${sym}`)}>
                          <div className="mrkt-mover-left">
                            <div className="mrkt-mini-badge">{info.abbr}</div>
                            <div>
                              <p className="mrkt-mover-sym">{sym}</p>
                              <p className="mrkt-mover-sub mrkt-text-mono">{info.sub}</p>
                            </div>
                          </div>
                          <div className="mrkt-mover-right">
                            <p className="mrkt-mover-price mrkt-text-mono">{info.price}</p>
                            <p className="mrkt-mover-change mrkt-neg">{info.change}</p>
                          </div>
                        </div>
                        {i < LOSERS_TICKERS.length - 1 && <div className="mrkt-hairline" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Most Active */}
              <div className="mrkt-movers-card mrkt-active-border">
                <div className="mrkt-movers-header">
                  <h3 className="mrkt-movers-title">MOST ACTIVE</h3>
                  <BarChart2 size={14} className="mrkt-icon-primary" />
                </div>
                <div className="mrkt-movers-list">
                  {ACTIVE_TICKERS.map((sym, i) => {
                    const info = ACTIVE_DATA[sym];
                    if (!info) return null;
                    return (
                      <div key={sym}>
                        <div className="mrkt-mover-row" onClick={() => navigate(`/stock/${sym}`)}>
                          <div className="mrkt-mover-left">
                            <div className="mrkt-mini-badge">{info.abbr}</div>
                            <div>
                              <p className="mrkt-mover-sym">{sym}</p>
                              <p className="mrkt-mover-sub mrkt-text-mono">{info.sub}</p>
                            </div>
                          </div>
                          <div className="mrkt-mover-right">
                            <p className="mrkt-mover-price mrkt-text-mono">{info.price}</p>
                            <p className="mrkt-mover-peak mrkt-text-mono">{info.peak}</p>
                          </div>
                        </div>
                        {i < ACTIVE_TICKERS.length - 1 && <div className="mrkt-hairline" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Intelligence */}
          <section>
            <div className="mrkt-news-header">
              <h2 className="mrkt-news-title">Financial Intelligence</h2>
              <button className="mrkt-view-all">VIEW ALL <ArrowRight size={14} /></button>
            </div>
            <div className="mrkt-news-grid">
              <div className="mrkt-news-card mrkt-news-card--primary group">
                <div className="mrkt-news-img" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ou1jduTS1hJW7zfBMwUo-xo3q0ujpxNZ55_83Dyn1_upS-id3lsucGYw5roxsZerpio1DCoXJiYCE6zJAtvTjWIthwWCbSQVATCkHUtCMcVXXoz60K9YRsIU4s1xAUtZdW6Xp533olN98Ec7UpRFxE6VnhOJ9B3sHAykrbZmhd3phgewA6aE_Km8MuvAFnSL8cHwBzRVnS3dv3VmKxjSKqxdpguHLlDRvEnqy1c3NbdlO43_yv2uMQ')", backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="mrkt-news-body">
                  <div className="mrkt-news-meta">
                    <span className="mrkt-news-tag mrkt-news-tag--primary">MARKETS</span>
                    <span className="mrkt-news-time mrkt-text-mono">14M AGO</span>
                  </div>
                  <h4 className="mrkt-news-headline">FED Interest Rate Decision: Pr...</h4>
                  <p className="mrkt-news-desc">Wall Street analysts remain divided as the Federal Reserve prepares for next policy meeting...</p>
                </div>
              </div>
              <div className="mrkt-news-card group">
                <div className="mrkt-news-img" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBmxo5Z5pKjpd6vWVXrqGp8uv_x1d3I6sIHinKLbQR1OY0jqPkoehCAKiuqStBXxrtmFzz50zdikHw4FRnQqWrLUtwaSugGnIWt2HAn-HIokLPcu4ZjWuLWwX5pgC0VzlK6uovhmgOKTNMHxyo86JFKXx5ekipYSzoxpSLFj2pt8xXkRS9MzkcP8YpnDcwOaMoLp8l-qCGwFWn-XbN_pjpUQ3L7o9bGX3Y-iP8HukE3wBgmZRwtkHkJMg')", backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="mrkt-news-body">
                  <div className="mrkt-news-meta">
                    <span className="mrkt-news-tag">TECH</span>
                    <span className="mrkt-news-time mrkt-text-mono">42M AGO</span>
                  </div>
                  <h4 className="mrkt-news-headline">Semiconductor Rally: AI Dem...</h4>
                  <p className="mrkt-news-desc">Nvidia and AMD lead sector upward as cloud providers increase capital expenditure for GPU clusters...</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recently Viewed */}
          <section>
            <h3 className="mrkt-recently-label">Recently Viewed</h3>
            <div className="mrkt-recently-grid">
              {RECENTLY_VIEWED_TICKERS.map((sym) => {
                const info = RECENTLY_DATA[sym];
                if (!info) return null;
                return (
                  <div key={sym} className="mrkt-recently-card" onClick={() => navigate(`/stock/${sym}`)}>
                    <div className="mrkt-recently-left">
                      <div className="mrkt-mini-badge">{info.abbr}</div>
                      <p className="mrkt-mover-sym">{sym}</p>
                    </div>
                    <p className={`mrkt-change-tag mrkt-text-mono ${info.positive ? "mrkt-pos" : "mrkt-neg"}`}>{info.change}</p>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Sidebar */}
        <div className="mrkt-right-col">

          {/* Upcoming Earnings */}
          <div className="mrkt-sidebar-card">
            <h3 className="mrkt-sidebar-title">Upcoming Earnings</h3>
            <div className="mrkt-sidebar-list">
              <div className="mrkt-earnings-row">
                <div className="mrkt-earnings-left">
                  <div className="mrkt-date-badge">
                    <span className="mrkt-date-month">JUN</span>
                    <span className="mrkt-date-day">12</span>
                  </div>
                  <div>
                    <p className="mrkt-earn-sym">ORCL</p>
                    <p className="mrkt-earn-session mrkt-text-mono">AMC TRADE</p>
                  </div>
                </div>
                <div className="mrkt-earnings-right">
                  <p className="mrkt-earn-eps mrkt-text-mono">$1.65</p>
                  <p className="mrkt-earn-label">EST EPS</p>
                </div>
              </div>
              <div className="mrkt-hairline mrkt-hairline--faint" />
              <div className="mrkt-earnings-row">
                <div className="mrkt-earnings-left">
                  <div className="mrkt-date-badge">
                    <span className="mrkt-date-month">JUN</span>
                    <span className="mrkt-date-day">15</span>
                  </div>
                  <div>
                    <p className="mrkt-earn-sym">ADBE</p>
                    <p className="mrkt-earn-session mrkt-text-mono">BMO TRADE</p>
                  </div>
                </div>
                <div className="mrkt-earnings-right">
                  <p className="mrkt-earn-eps mrkt-text-mono">$4.39</p>
                  <p className="mrkt-earn-label">EST EPS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analyst Picks */}
          <div className="mrkt-sidebar-card">
            <h3 className="mrkt-sidebar-title">Analyst Picks</h3>
            <div className="mrkt-sidebar-list">
              <div className="mrkt-analyst-card mrkt-analyst-card--buy">
                <div className="mrkt-analyst-header">
                  <p className="mrkt-earn-sym">NVDA</p>
                  <span className="mrkt-analyst-tag mrkt-analyst-tag--buy">Strong Buy</span>
                </div>
                <p className="mrkt-analyst-desc">GS raises PT to $1,100 citing infra strength.</p>
              </div>
              <div className="mrkt-analyst-card">
                <div className="mrkt-analyst-header">
                  <p className="mrkt-earn-sym">AAPL</p>
                  <span className="mrkt-analyst-tag">Neutral</span>
                </div>
                <p className="mrkt-analyst-desc">JPM cautious on China headwinds.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

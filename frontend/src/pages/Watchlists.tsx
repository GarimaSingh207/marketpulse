import { useEffect, useState, useCallback, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Watchlist } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Eye,
  TrendingUp,
  ShoppingCart,
  Filter,
  Bell,
  PieChart,
  ArrowRight,
} from "lucide-react";
import "./Watchlists.css";

// Ticker metadata mapping for premium display
const STOCK_METADATA: Record<string, { name: string; sector: string; logoUrl?: string }> = {
  NVDA: {
    name: "NVIDIA Corp.",
    sector: "Technology",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCF3U_j1OgxO1WwU0COVu-c_qgBVOU_O93G8D1NiRJyXmKJzXRf1givVN6fNOsRQ5qoJcVWYZISt9fNWSUoDqI7e9KSsoPnulRfnFkFdmeM75tg-mPrrUj4kVg1W57HlPF_6ZA8fBmFOOumXcmhDSugI_Th6pmp7a09t0SDCeZcoa4u8VOYLGzsvELaoXfQRzOmrdaI1ioJRIhabF1MLb5T4xL_TDRYwlp4QbdmslHg_67hEY02_QanJw"
  },
  MSFT: {
    name: "Microsoft Corp.",
    sector: "Technology",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeHe4od7_tLXH-C6YS_NqAtFb8flF8_nbgS_fDZopyl9LodoLZuNz7-AkuSOPX0B2YBM4kIseWupR7e4JBlHv3IE-EBhtqPNHc4LWtr7T7_D_UZ-K09SfXgbqpiX36lmz7t5uIdWTm4Mjn5_wafrHBQJ4mfzJ_hB48i-ZPhBA4umye-SeVhnqOHRBUYtDr0IysDqiufAqz0Q2HcRVoauZnZZUXAX-jnpw2TuYygzKJAf_Pw7CSVCCJ7Q"
  },
  AAPL: {
    name: "Apple Inc.",
    sector: "Consumer Tech",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUkcM0_1TBrxAE0tooxJpqNy7I1pCAj0hY-3Nm1xF91vJmy4MoYkmUAtJY8xIS8SGJsMkbK8ozZyWLkgGdFzUbAl-SyYVnYF8l4ErHt15a44j7kgXcALOQts6nxvaehFLi9Zzm3rkEfB5OPYO4sC24BkRrQhFXviMFOfa_AzSTujG7reCw97cN3Fml8MBZjP8UsLLh9p9mgDrp12tO3RoMrLGCXZcA-PM3d-MLhqPlmnZ1wA_xRCfi5Q"
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Consumer Cyclical",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLQTogqpTZVyzzJnE4AVj6pUq14ZNE3skarm9_r2b3K4KIK9gAoLzVxpUnof99k5zlsUgR8rqfRht_Z-eMRI_48fWXU9q34f5zwpz1WOmc4cEqPIu1xZ-OOP9z3wHcdxd6I8mfu8TAVH-aHrjoIAiLwvcehjwYK_Z_3LJ9FopEvpxJM1DPEvOcc27YvEt7_lR3YDwGOL1bK0WQAiq5LCF4GVnMHxR3o-pkKa3bUUXuu_SljSQTijkgVQ"
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCF3U_j1OgxO1WwU0COVu-c_qgBVOU_O93G8D1NiRJyXmKJzXRf1givVN6fNOsRQ5qoJcVWYZISt9fNWSUoDqI7e9KSsoPnulRfnFkFdmeM75tg-mPrrUj4kVg1W57HlPF_6ZA8fBmFOOumXcmhDSugI_Th6pmp7a09t0SDCeZcoa4u8VOYLGzsvELaoXfQRzOmrdaI1ioJRIhabF1MLb5T4xL_TDRYwlp4QbdmslHg_67hEY02_QanJw"
  },
  GOOG: {
    name: "Alphabet Inc.",
    sector: "Technology",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ou1jduTS1hJW7zfBMwUo-xo3q0ujpxNZ55_83Dyn1_upS-id3lsucGYw5roxsZerpio1DCoXJiYCE6zJAtvTjWIthwWCbSQVATCkHUtCMcVXXoz60K9YRsIU4s1xAUtZdW6Xp533olN98Ec7UpRFxE6VnhOJ9B3sHAykrbZmhd3phgewA6aE_Km8MuvAFnSL8cHwBzRVnS3dv3VmKxjSKqxdpguHLlDRvEnqy1c3NbdlO43_yv2uMQ"
  },
  NFLX: {
    name: "Netflix Inc.",
    sector: "Communication",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkze4D8k0MJt6HLekZomYp30xRvWBPzMKqmxt34dY0xvo1fdY94a4Er4ElMK9GrC1EJJ0DlyimkkQuIeGOTWCZU2mL_h9cb-JeFOQTm_QITA-ci4EnuIvZZGLHY1O3QYfAq2_f-kEYPPFM-n354U9HKILuuTFh9rx8QD4PrNXCsk1XS2OECnLzMkh_W2v9L2rs0Pw4BHbIXHt9OyQFNlqZWDPfdqYAfv1ceHxnxx-8oZbospe1V3pBjA"
  },
  META: {
    name: "Meta Platforms Inc.",
    sector: "Technology",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT-dW9gjJEYdxr-2VuiLQK5Q5V2M9gckjXE5obxH5zmtVwVgBTsjgLdmuXLTG7-X2Oy_BKBswwJNlwgD9xRx_DH0GaHgWXEYjqsvaOzPQSPqQwMy4fndFj_FvrZ1ODeYoRTa3OlvlC1NQyxFn-yhWGTjm7iaHW1INNO8dEAwvyl9MFFr7cRDsAACuiXAXoQmxh1igJgmr_870Acg6wJf2sMTh8qCBvV57e-R7QilfaD7_Lbi3sio1gUA"
  },
};

export default function Watchlists() {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("Sector: All");
  const [sortBy, setSortBy] = useState("Sort: Symbol");

  // Price flash detection
  const prevPricesRef = useRef<Record<string, number>>({});
  const [priceDirections, setPriceDirections] = useState<Record<string, "up" | "down" | null>>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");

  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState("");

  // Deletion confirm states
  const [watchlistToDelete, setWatchlistToDelete] = useState<{ id: string; name: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchWatchlists = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<Watchlist[]>("/api/watchlists");
      const list = res.data;
      setWatchlists(list);

      // If we have a selected watchlist, reload its detailed view with live prices
      if (selectedWatchlist) {
        const detailRes = await api.get<Watchlist>(`/api/watchlists/${selectedWatchlist.id}`).catch(() => null);
        if (detailRes) {
          setSelectedWatchlist(detailRes.data);
        }
      } else if (list.length > 0) {
        // Select first by default
        const detailRes = await api.get<Watchlist>(`/api/watchlists/${list[0].id}`).catch(() => null);
        if (detailRes) {
          setSelectedWatchlist(detailRes.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load watchlists.");
    } finally {
      setLoading(false);
    }
  }, [selectedWatchlist?.id]);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  // Track price flashing direction
  useEffect(() => {
    if (!selectedWatchlist?.stocks) return;
    const newDirections: Record<string, "up" | "down" | null> = {};
    let hasChanges = false;

    selectedWatchlist.stocks.forEach((st) => {
      if (st.currentPrice === null || st.currentPrice === undefined) return;
      const prev = prevPricesRef.current[st.symbol];
      if (prev !== undefined && prev !== st.currentPrice) {
        newDirections[st.symbol] = st.currentPrice > prev ? "up" : "down";
        hasChanges = true;
      }
      prevPricesRef.current[st.symbol] = st.currentPrice;
    });

    if (hasChanges) {
      setPriceDirections((prevDir) => ({ ...prevDir, ...newDirections }));
      const timer = setTimeout(() => {
        setPriceDirections({});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedWatchlist?.stocks]);

  const selectWatchlistById = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get<Watchlist>(`/api/watchlists/${id}`);
      setSelectedWatchlist(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load watchlist details.");
    } finally {
      setLoading(false);
    }
  };

  // Socket.IO event handling
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchWatchlists();
    };

    const events = [
      "watchlist:created",
      "watchlist:deleted",
      "watchlist:stockAdded",
      "watchlist:stockRemoved",
    ];

    events.forEach((event) => socket.on(event, handleUpdate));
    return () => {
      events.forEach((event) => socket.off(event, handleUpdate));
    };
  }, [socket, fetchWatchlists]);

  const handleCreateWatchlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<Watchlist>("/api/watchlists", { name: newWatchlistName.trim() });
      setNewWatchlistName("");
      setShowCreateModal(false);
      await fetchWatchlists();
      selectWatchlistById(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create watchlist.");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDeleteWatchlist = async () => {
    if (!watchlistToDelete) return;
    const { id } = watchlistToDelete;
    setWatchlistToDelete(null);

    try {
      await api.delete(`/api/watchlists/${id}`);
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(null);
      }
      fetchWatchlists();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete watchlist.");
    }
  };

  const handleAddStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStockSymbol.trim() || !selectedWatchlist) return;

    setSubmitting(true);
    setError(null);
    const symbol = newStockSymbol.trim().toUpperCase();

    try {
      await api.post(`/api/watchlists/${selectedWatchlist.id}/stocks`, { symbol });
      setNewStockSymbol("");
      setShowAddStockModal(false);
      selectWatchlistById(selectedWatchlist.id);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0] || "Failed to add stock."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    if (!selectedWatchlist) return;

    try {
      await api.delete(`/api/watchlists/${selectedWatchlist.id}/stocks/${symbol}`);
      selectWatchlistById(selectedWatchlist.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove stock.");
    }
  };

  // Filter & Sort list computation
  const getFilteredStocks = () => {
    if (!selectedWatchlist?.stocks) return [];

    let list = [...selectedWatchlist.stocks];

    // Filter by symbol input
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase();
      list = list.filter((s) => s.symbol.toUpperCase().includes(q));
    }

    // Filter by sector
    if (sectorFilter !== "Sector: All") {
      list = list.filter((s) => {
        const meta = STOCK_METADATA[s.symbol.toUpperCase()];
        return meta && meta.sector === sectorFilter;
      });
    }

    // Sorting
    if (sortBy === "Sort: Symbol") {
      list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortBy === "Sort: Price") {
      list.sort((a, b) => {
        const pa = a.currentPrice || 0;
        const pb = b.currentPrice || 0;
        return pb - pa;
      });
    }

    return list;
  };

  const filteredStocks = getFilteredStocks();

  if (loading && watchlists.length === 0) return <Spinner text="Syncing watchlists…" />;

  return (
    <div className="wl-full-bleed">
      <div className="wl-root wl-stagger-load">
        <div className="wl-inner">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <section className="wl-page-header">
            <div>
              <h1 className="wl-page-title">Watchlist Workspace</h1>
              <p className="wl-page-subtitle">
                Real-time custom watchlists tracking and active asset monitoring.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="wl-btn-stone"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={14} /> Create Watchlist
              </button>
              {selectedWatchlist && (
                <button
                  className="wl-btn-gold"
                  onClick={() => setShowAddStockModal(true)}
                >
                  <Plus size={14} /> Add Stock Ticker
                </button>
              )}
            </div>
          </section>

          {error && <ErrorBanner message={error} />}

          {watchlists.length === 0 ? (
            <EmptyState
              icon={<Eye size={24} />}
              title="No Watchlists Created"
              message="Keep watch on specific assets by organizing them inside custom list tabs."
              action={
                <button className="wl-btn-gold" onClick={() => setShowCreateModal(true)}>
                  <Plus size={14} /> Create Watchlist
                </button>
              }
            />
          ) : (
            <>
              {/* ── Summary Bento Cards Grid (6 cards) ────────────────────── */}
              <div className="wl-bento-grid">
                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">TOTAL LISTS</span>
                    <span className="wl-bento-val gold">{watchlists.length}</span>
                    <span className="wl-bento-sub">Custom sets</span>
                  </div>
                </div>

                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">WATCHED ASSETS</span>
                    <span className="wl-bento-val">{selectedWatchlist?.stocks?.length || 0}</span>
                    <span className="wl-bento-sub">Active list</span>
                  </div>
                </div>

                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">GAINERS</span>
                    <span className="wl-bento-val muted">N/A</span>
                    <span className="wl-bento-sub">Unavailable</span>
                  </div>
                </div>

                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">LOSERS</span>
                    <span className="wl-bento-val muted">N/A</span>
                    <span className="wl-bento-sub">Unavailable</span>
                  </div>
                </div>

                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">AVG CHANGE</span>
                    <span className="wl-bento-val muted">N/A</span>
                    <span className="wl-bento-sub">Unavailable</span>
                  </div>
                </div>

                <div className="wl-bento-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", textAlign: "center" }}>
                    <span className="wl-bento-title">LAGGARD</span>
                    <span className="wl-bento-val muted">N/A</span>
                    <span className="wl-bento-sub">Unavailable</span>
                  </div>
                </div>
              </div>

              {/* ── Asymmetrical 12-Column Layout ───────────────────────────── */}
              <div className="wl-grid-12">

                {/* Left 9-Column Main Workspace */}
                <div style={{ gridColumn: "span 9" }}>

                  {/* Your Watchlists Selector Bar */}
                  <div className="wl-tabs-bar">
                    <span className="wl-tabs-bar-label">YOUR WATCHLISTS</span>
                    <div className="wl-tabs-list">
                      {watchlists.map((w) => (
                        <button
                          key={w.id}
                          className={`wl-tab-btn ${selectedWatchlist?.id === w.id ? "active" : ""}`}
                          onClick={() => selectWatchlistById(w.id)}
                        >
                          <Eye size={13} />
                          <span>{w.name}</span>
                          <span className="wl-tab-count">{w.stocks?.length || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedWatchlist ? (
                    <motion.div
                      key={selectedWatchlist.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Filter & Action Toolbar */}
                      <div className="wl-filter-strip">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Filter size={14} style={{ color: "var(--wl-primary)" }} />
                          <input
                            type="text"
                            placeholder="Filter by Symbol..."
                            className="wl-filter-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        <select
                          className="wl-filter-select"
                          value={sectorFilter}
                          onChange={(e) => setSectorFilter(e.target.value)}
                        >
                          <option value="Sector: All">Sector: All</option>
                          <option value="Technology">Technology</option>
                          <option value="Consumer Cyclical">Consumer Cyclical</option>
                          <option value="Communication">Communication</option>
                        </select>

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--wl-on-surface-variant)", opacity: 0.5, textTransform: "uppercase" }}>
                            Sort
                          </span>
                          <select
                            className="wl-filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="Sort: Symbol">Sort: Symbol</option>
                            <option value="Sort: Price">Sort: Price</option>
                          </select>
                        </div>

                        <button
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--wl-on-surface-variant)",
                            cursor: "pointer",
                            padding: "0.4rem",
                            borderRadius: "4px",
                            marginLeft: "0.5rem",
                            transition: "color 0.2s, background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--wl-error)";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 180, 171, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--wl-on-surface-variant)";
                            (e.currentTarget as HTMLButtonElement).style.background = "none";
                          }}
                          onClick={() =>
                            setWatchlistToDelete({ id: selectedWatchlist.id, name: selectedWatchlist.name })
                          }
                          title="Delete Watchlist"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Technical Watchlist Table */}
                      {!selectedWatchlist.stocks || selectedWatchlist.stocks.length === 0 ? (
                        <EmptyState
                          icon={<TrendingUp size={22} />}
                          title="Watchlist Empty"
                          message="You haven't added any stock symbols to this list yet. Start tracking below."
                          action={
                            <button className="wl-btn-gold" onClick={() => setShowAddStockModal(true)}>
                              <Plus size={14} /> Add Stock Ticker
                            </button>
                          }
                        />
                      ) : (
                        <div className="wl-table-card">
                          <div className="wl-custom-scrollbar" style={{ overflowX: "auto" }}>
                            <table className="wl-table">
                              <thead>
                                <tr>
                                  <th>Company</th>
                                  <th>Symbol</th>
                                  <th style={{ textAlign: "right" }}>Price</th>
                                  <th style={{ textAlign: "right" }}>Chg %</th>
                                  <th style={{ textAlign: "right" }}>Mkt Cap</th>
                                  <th style={{ textAlign: "right" }}>Volume</th>
                                  <th>Trend (1D)</th>
                                  <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody className="wl-text-mono">
                                {filteredStocks.map((st) => {
                                  const meta = STOCK_METADATA[st.symbol.toUpperCase()] || {
                                    name: st.symbol,
                                    sector: "Other",
                                    logoUrl: "",
                                  };

                                  const priceDirection = priceDirections[st.symbol];
                                  const flashClass =
                                    priceDirection === "up"
                                      ? "wl-price-flash-green"
                                      : priceDirection === "down"
                                      ? "wl-price-flash-red"
                                      : "";

                                  return (
                                    <tr
                                      key={st.id}
                                      style={{ cursor: "pointer" }}
                                      onClick={(e) => {
                                        if ((e.target as HTMLElement).closest("button")) return;
                                        navigate(`/stock/${st.symbol}`);
                                      }}
                                    >
                                      <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                          <div style={{ width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "#0e0e0e", border: "1px solid var(--wl-outline-variant)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.25rem", flexShrink: 0 }}>
                                            {meta.logoUrl ? (
                                              <img
                                                alt={st.symbol}
                                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                src={meta.logoUrl}
                                              />
                                            ) : (
                                              <span style={{ fontWeight: 700, fontSize: "10px", color: "var(--wl-primary)" }}>
                                                {st.symbol.slice(0, 3)}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "13px", color: "var(--wl-on-surface)" }}>
                                              {meta.name}
                                            </p>
                                            <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--wl-on-surface-variant)", opacity: 0.5, letterSpacing: "0.08em" }}>
                                              {meta.sector.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ fontWeight: 700, color: "var(--wl-primary)", fontSize: "13px" }}>
                                        {st.symbol}
                                      </td>
                                      <td className={flashClass} style={{ textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                                        {st.currentPrice !== null && st.currentPrice !== undefined ? (
                                          `$${st.currentPrice.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}`
                                        ) : (
                                          <span style={{ color: "var(--wl-on-surface-variant)", opacity: 0.4, fontSize: "11px" }}>
                                            Connecting...
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: "right", fontSize: "12px", color: "var(--wl-on-surface-variant)", opacity: 0.4 }}>
                                        N/A
                                      </td>
                                      <td style={{ textAlign: "right", fontSize: "12px", color: "var(--wl-on-surface-variant)", opacity: 0.4 }}>
                                        N/A
                                      </td>
                                      <td style={{ textAlign: "right", fontSize: "12px", color: "var(--wl-on-surface-variant)", opacity: 0.4 }}>
                                        N/A
                                      </td>
                                      <td>
                                        <div style={{ height: "24px", width: "70px" }}>
                                          <svg style={{ width: "100%", height: "100%", color: "var(--wl-primary)" }} preserveAspectRatio="none" viewBox="0 0 100 30">
                                            <path d="M0,25 L20,22 L40,24 L60,10 L80,12 L100,5" fill="none" stroke="currentColor" strokeWidth="2" />
                                          </svg>
                                        </div>
                                      </td>
                                      <td style={{ textAlign: "right" }}>
                                        <div className="wl-table-actions">
                                          <button
                                            type="button"
                                            className="wl-action-btn"
                                            onClick={() => navigate(`/stock/${st.symbol}`)}
                                            title="View Workspace"
                                          >
                                            <Eye size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            className="wl-action-btn"
                                            onClick={() => navigate(`/stock/${st.symbol}`)}
                                            title="Trade Asset"
                                          >
                                            <ShoppingCart size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            className="wl-action-btn delete"
                                            onClick={() => handleRemoveStock(st.symbol)}
                                            title="Remove Symbol"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <EmptyState
                      icon={<Eye size={24} />}
                      message="Select a watchlist from the top bar to track live feeds."
                    />
                  )}
                </div>

                {/* Right 3-Column Intelligence Rail */}
                <div style={{ gridColumn: "span 3" }}>

                  {/* Recent Alerts Panel */}
                  <div className="wl-rail-card">
                    <div className="wl-rail-header">
                      <span className="wl-rail-title">
                        <Bell size={14} style={{ color: "var(--wl-primary)" }} /> Recent Alerts
                      </span>
                      <span style={{ fontSize: "9px", color: "var(--wl-primary)", cursor: "pointer", textTransform: "uppercase", fontWeight: 700 }}>
                        CLEAR ALL
                      </span>
                    </div>
                    <div>
                      <div className="wl-alert-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="wl-alert-title">NVDA Price Target Reached</span>
                          <span style={{ fontSize: "9px", color: "var(--wl-on-surface-variant)", opacity: 0.6 }}>14m ago</span>
                        </div>
                        <p className="wl-alert-desc">Asset breached $820.00 resistance level. RSI at 74.3.</p>
                      </div>

                      <div className="wl-alert-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="wl-alert-title">TSLA High Volume Alert</span>
                          <span style={{ fontSize: "9px", color: "var(--wl-on-surface-variant)", opacity: 0.6 }}>1h ago</span>
                        </div>
                        <p className="wl-alert-desc">Volume spike detected (2.4x avg). Sudden intraday move.</p>
                      </div>

                      <div className="wl-alert-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="wl-alert-title">MSFT Earnings Release</span>
                          <span style={{ fontSize: "9px", color: "var(--wl-on-surface-variant)", opacity: 0.6 }}>3h ago</span>
                        </div>
                        <p className="wl-alert-desc">Quarterly report confirmed. Guidance adjusted upwards.</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Insights Premium Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                    {/* Sector Distribution Card */}
                    <div className="wl-rail-card" style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span className="wl-bento-title">SECTOR DISTRIBUTION</span>
                        <PieChart size={14} style={{ color: "var(--wl-on-surface-variant)", opacity: 0.6 }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "0.25rem" }}>
                            <span>Technology</span>
                            <span style={{ fontFamily: "var(--font-mono)" }}>45%</span>
                          </div>
                          <div style={{ width: "100%", height: "4px", backgroundColor: "var(--wl-bg)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: "45%", backgroundColor: "var(--wl-primary)" }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "0.25rem" }}>
                            <span>Consumer Cyclical</span>
                            <span style={{ fontFamily: "var(--font-mono)" }}>22%</span>
                          </div>
                          <div style={{ width: "100%", height: "4px", backgroundColor: "var(--wl-bg)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: "22%", backgroundColor: "var(--wl-secondary)" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Volatility Index (VIX) Card */}
                    <div className="wl-rail-card" style={{ padding: "1.25rem" }}>
                      <span className="wl-bento-title">VOLATILITY INDEX (VIX)</span>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700 }}>14.82</p>
                          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--wl-error)", fontFamily: "var(--font-mono)" }}>
                            +1.4% (Fear Rising)
                          </p>
                        </div>
                        <div style={{ height: "30px", width: "70px" }}>
                          <svg style={{ width: "100%", height: "100%", color: "var(--wl-error)" }} preserveAspectRatio="none" viewBox="0 0 100 30">
                            <path d="M0,25 L20,22 L40,24 L60,10 L80,12 L100,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Highest Volume Asset Card */}
                    <div className="wl-rail-card" style={{ padding: "1.25rem", cursor: "pointer" }} onClick={() => navigate("/stock/TSLA")}>
                      <span className="wl-bento-title">HIGHEST VOLUME ASSET</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "#ffffff", padding: "0.2rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img
                            alt="TSLA"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLQTogqpTZVyzzJnE4AVj6pUq14ZNE3skarm9_r2b3K4KIK9gAoLzVxpUnof99k5zlsUgR8rqfRht_Z-eMRI_48fWXU9q34f5zwpz1WOmc4cEqPIu1xZ-OOP9z3wHcdxd6I8mfu8TAVH-aHrjoIAiLwvcehjwYK_Z_3LJ9FopEvpxJM1DPEvOcc27YvEt7_lR3YDwGOL1bK0WQAiq5LCF4GVnMHxR3o-pkKa3bUUXuu_SljSQTijkgVQ"
                          />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--wl-on-surface)" }}>TSLA</p>
                          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--wl-on-surface-variant)" }}>102.4M Shares</p>
                        </div>
                        <ArrowRight size={16} style={{ marginLeft: "auto", color: "var(--wl-primary)" }} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Create Watchlist Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal title="Create New Watchlist" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreateWatchlist}>
              <div className="form-group mb-6">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="watchlistName">
                  Watchlist Name
                </label>
                <input
                  id="watchlistName"
                  type="text"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="e.g. Semiconductor Focus, High Yield"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="wl-btn-gold" disabled={submitting}>
                  {submitting ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Add Stock Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddStockModal && selectedWatchlist && (
          <Modal title={`Add Stock to ${selectedWatchlist.name}`} onClose={() => setShowAddStockModal(false)}>
            <form onSubmit={handleAddStock}>
              <div className="form-group mb-6">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="stockSymbol">
                  Stock Symbol (Ticker)
                </label>
                <input
                  id="stockSymbol"
                  type="text"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, MSFT, TSLA"
                  required
                  autoFocus
                  maxLength={10}
                />
              </div>
              <div className="modal-actions flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-ghost"
                  onClick={() => setShowAddStockModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="wl-btn-gold" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Symbol"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Confirm Deletion Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        open={watchlistToDelete !== null}
        title="Delete Watchlist"
        description={`Are you sure you want to delete the watchlist "${watchlistToDelete?.name}"? You will lose tracking of all stock tickers configured on this list. This action cannot be undone.`}
        confirmLabel="Delete Watchlist"
        onConfirm={executeDeleteWatchlist}
        onCancel={() => setWatchlistToDelete(null)}
      />
    </div>
  );
}

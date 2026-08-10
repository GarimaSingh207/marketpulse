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
    sector: "Technology",
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
    <div className="wl-root wl-stagger-load">
      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Watchlist Workspace</h1>
          <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant mt-1">
            Real-time custom watchlists tracking and active asset monitoring.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-surface-container border border-outline-variant hover:bg-surface-bright text-on-surface font-medium px-5 py-2.5 rounded-sm text-xs transition-all active:scale-95 flex items-center gap-1.5"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} /> Create Watchlist
          </button>
          {selectedWatchlist && (
            <button
              className="bg-primary hover:bg-primary-container text-on-primary font-medium px-5 py-2.5 rounded-sm text-xs transition-all active:scale-95 flex items-center gap-1.5"
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
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Create Watchlist
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Summary Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  TOTAL LISTS
                </span>
                <span className="font-mono text-2xl font-bold text-primary mt-1">
                  {watchlists.length}
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Custom sets</span>
              </div>
            </div>

            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  WATCHED ASSETS
                </span>
                <span className="font-mono text-2xl font-bold text-on-surface mt-1">
                  {selectedWatchlist?.stocks?.length || 0}
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Active list</span>
              </div>
            </div>

            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  GAINERS
                </span>
                <span className="font-mono text-xl font-bold text-on-surface-variant/40 mt-1">
                  N/A
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Unavailable</span>
              </div>
            </div>

            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  LOSERS
                </span>
                <span className="font-mono text-xl font-bold text-on-surface-variant/40 mt-1">
                  N/A
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Unavailable</span>
              </div>
            </div>

            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  AVG CHANGE
                </span>
                <span className="font-mono text-xl font-bold text-on-surface-variant/40 mt-1">
                  N/A
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Unavailable</span>
              </div>
            </div>

            <div className="wl-bento-card">
              <div className="flex flex-col items-center justify-between h-full text-center py-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 tracking-wider">
                  LAGGARD
                </span>
                <span className="font-mono text-xl font-bold text-on-surface-variant/40 mt-1">
                  N/A
                </span>
                <span className="text-[9px] text-on-surface-variant/60 mt-1">Unavailable</span>
              </div>
            </div>
          </div>

          {/* Asymmetrical Layout Section */}
          <div className="wl-layout">
            {/* Sidebar list select (col-span-1) */}
            <div className="wl-sidebar">
              <h3 className="wl-sidebar-title">Your Watchlists</h3>
              <div className="space-y-1">
                {watchlists.map((w) => (
                  <button
                    key={w.id}
                    className={`wl-tab-btn ${selectedWatchlist?.id === w.id ? "active" : ""}`}
                    onClick={() => selectWatchlistById(w.id)}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Eye size={13} />
                      <span className="truncate">{w.name}</span>
                    </span>
                    <span className="bg-surface-container-high text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded font-mono">
                      {w.stocks?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Watchlist detail area (col-span-2) */}
            <div className="wl-content-area space-y-4">
              {selectedWatchlist ? (
                <motion.div
                  key={selectedWatchlist.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Toolbar & Filter Strip */}
                  <div className="wl-filter-strip">
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-primary" />
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

                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase">
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
                      className="text-on-surface-variant hover:text-error hover:bg-red-500/10 p-1.5 rounded transition-all ml-2"
                      onClick={() =>
                        setWatchlistToDelete({ id: selectedWatchlist.id, name: selectedWatchlist.name })
                      }
                      title="Delete Watchlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* List Stock Data Table */}
                  {!selectedWatchlist.stocks || selectedWatchlist.stocks.length === 0 ? (
                    <EmptyState
                      icon={<TrendingUp size={22} />}
                      title="Watchlist Empty"
                      message="You haven't added any stock symbols to this list yet. Start tracking below."
                      action={
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddStockModal(true)}>
                          <Plus size={14} /> Add Stock Ticker
                        </button>
                      }
                    />
                  ) : (
                    <div className="wl-bento-card p-0 overflow-hidden">
                      <div className="overflow-x-auto wl-custom-scrollbar">
                        <table className="wl-table">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Symbol</th>
                              <th className="text-right">Price</th>
                              <th className="text-right">Chg %</th>
                              <th className="text-right">Mkt Cap</th>
                              <th className="text-right">Volume</th>
                              <th>Trend (1D)</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 wl-text-mono">
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
                                  className="group hover:bg-surface-variant/10 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    // Navigate to details on row click unless actions button clicked
                                    if ((e.target as HTMLElement).closest("button")) return;
                                    navigate(`/stock/${st.symbol}`);
                                  }}
                                >
                                  <td>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center p-1 shrink-0 border border-outline-variant/10">
                                        {meta.logoUrl ? (
                                          <img
                                            alt={st.symbol}
                                            className="w-full h-full object-contain"
                                            src={meta.logoUrl}
                                          />
                                        ) : (
                                          <span className="font-bold text-[10px] text-primary">
                                            {st.symbol.slice(0, 3)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="truncate">
                                        <p className="font-body-md font-semibold text-on-surface text-xs truncate">
                                          {meta.name}
                                        </p>
                                        <p className="text-[8px] font-bold text-on-surface-variant/40 tracking-wider">
                                          {meta.sector}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="font-bold text-primary text-xs">
                                    {st.symbol}
                                  </td>
                                  <td className={`text-right font-semibold text-xs ${flashClass}`}>
                                    {st.currentPrice !== null && st.currentPrice !== undefined ? (
                                      `$${st.currentPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                    ) : (
                                      <span className="text-on-surface-variant/40 text-[10px]">
                                        Connecting...
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-right text-xs text-on-surface-variant/40">
                                    N/A
                                  </td>
                                  <td className="text-right text-xs text-on-surface-variant/40">
                                    N/A
                                  </td>
                                  <td className="text-right text-xs text-on-surface-variant/40">
                                    N/A
                                  </td>
                                  <td>
                                    <span className="text-on-surface-variant/40 text-[10px]">
                                      N/A
                                    </span>
                                  </td>
                                  <td className="text-right">
                                    <div className="wl-table-actions">
                                      <button
                                        type="button"
                                        className="text-on-surface-variant hover:text-primary p-1.5"
                                        onClick={() => navigate(`/stock/${st.symbol}`)}
                                        title="View Workspace"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="text-on-surface-variant hover:text-primary p-1.5"
                                        onClick={() => navigate(`/stock/${st.symbol}`)}
                                        title="Trade Asset"
                                      >
                                        <ShoppingCart size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="text-on-surface-variant hover:text-error p-1.5"
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
                  message="Select a watchlist from the left panel to track live feeds."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Watchlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal title="Create New Watchlist" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreateWatchlist}>
              <div className="form-group">
                <label className="form-label" htmlFor="watchlistName">
                  Watchlist Name
                </label>
                <input
                  id="watchlistName"
                  type="text"
                  className="form-input"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="e.g. Semiconductor Focus, High Yield"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddStockModal && selectedWatchlist && (
          <Modal title={`Add Stock to ${selectedWatchlist.name}`} onClose={() => setShowAddStockModal(false)}>
            <form onSubmit={handleAddStock}>
              <div className="form-group">
                <label className="form-label" htmlFor="stockSymbol">
                  Stock Symbol (Ticker)
                </label>
                <input
                  id="stockSymbol"
                  type="text"
                  className="form-input"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, MSFT, TSLA"
                  required
                  autoFocus
                  maxLength={10}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddStockModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Symbol"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirm Deletion Dialog */}
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

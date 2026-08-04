import { useEffect, useState, useCallback, FormEvent } from "react";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Watchlist } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Eye, TrendingUp } from "lucide-react";

export default function Watchlists() {
  const { socket } = useSocket();

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && watchlists.length === 0) return <Spinner text="Syncing watchlists…" />;

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
          <h1 className="page-title">Watchlists</h1>
          <p className="page-subtitle">Track custom stock sets, check live ticks, and manage targets.</p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Watchlist</span>
        </motion.button>
      </motion.div>

      {error && <ErrorBanner message={error} />}

      {watchlists.length === 0 ? (
        <EmptyState
          icon={<Eye size={24} />}
          title="No Watchlists Created"
          message="Keep watch on specific assets by organizing them inside list tabs."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Create Watchlist
            </button>
          }
        />
      ) : (
        <div className="watchlist-layout">
          {/* Watchlist Sidebar */}
          <div className="watchlist-sidebar">
            <h3
              style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
                letterSpacing: "0.08em",
                fontWeight: 700,
                padding: "0 0.5rem"
              }}
            >
              Your lists
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {watchlists.map((w) => (
                <button
                  key={w.id}
                  className={`watchlist-tab ${selectedWatchlist?.id === w.id ? "active" : ""}`}
                  onClick={() => selectWatchlistById(w.id)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Eye size={14} />
                    <span>{w.name}</span>
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem" }}>
                    {w.stocks?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Watchlist Detail */}
          <div style={{ width: "100%" }}>
            {selectedWatchlist ? (
              <motion.div
                key={selectedWatchlist.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card"
              >
                <div className="card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <h2 className="card-title" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                      {selectedWatchlist.name}
                    </h2>
                    <p className="card-subtitle">
                      {selectedWatchlist.stocks?.length || 0} stock ticker positions tracked live
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddStockModal(true)}>
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Add Stock</span>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setWatchlistToDelete({ id: selectedWatchlist.id, name: selectedWatchlist.name })}
                      style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <Trash2 size={13} />
                      <span>Delete List</span>
                    </button>
                  </div>
                </div>

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
                  <div className="table-wrap" style={{ marginTop: "1rem" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Live Price Feed</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWatchlist.stocks.map((st) => (
                          <tr key={st.id}>
                            <td className="table-symbol" style={{ fontSize: "0.95rem" }}>{st.symbol}</td>
                            <td className="table-price text-profit" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                              {st.currentPrice !== null && st.currentPrice !== undefined ? (
                                `$${st.currentPrice.toFixed(2)}`
                              ) : (
                                <span className="text-muted" style={{ fontWeight: 500, fontSize: "0.8rem" }}>
                                  Connecting ticker…
                                </span>
                              )}
                            </td>
                            <td className="text-right">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveStock(st.symbol)}
                                aria-label={`Remove stock ${st.symbol}`}
                                style={{ padding: "0.4rem" }}
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            ) : (
              <EmptyState icon="👈" message="Select a watchlist from the left panel to track live feeds." />
            )}
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

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Watchlist } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

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

    socket.on("watchlist:created", handleUpdate);
    socket.on("watchlist:deleted", handleUpdate);
    socket.on("watchlist:stockAdded", handleUpdate);
    socket.on("watchlist:stockRemoved", handleUpdate);

    return () => {
      socket.off("watchlist:created", handleUpdate);
      socket.off("watchlist:deleted", handleUpdate);
      socket.off("watchlist:stockAdded", handleUpdate);
      socket.off("watchlist:stockRemoved", handleUpdate);
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

  const handleDeleteWatchlist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;

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
    if (!selectedWatchlist || !newStockSymbol.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/watchlists/${selectedWatchlist.id}/stocks`, {
        symbol: newStockSymbol.trim().toUpperCase(),
      });
      setNewStockSymbol("");
      setShowAddStockModal(false);
      selectWatchlistById(selectedWatchlist.id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || "Failed to add stock.");
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

  if (loading && watchlists.length === 0) return <Spinner />;

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Watchlists</h1>
          <p className="text-muted">Monitor real-time prices of your favorite stocks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Watchlist
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {watchlists.length === 0 ? (
        <EmptyState icon="👁" message="No watchlists found. Click 'Create Watchlist' to start tracking stocks." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem" }}>
          {/* Watchlist Tabs Sidebar */}
          <div className="card" style={{ padding: "1rem" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Your Watchlists
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {watchlists.map((w) => (
                <button
                  key={w.id}
                  className={`sidebar-link ${selectedWatchlist?.id === w.id ? "active" : ""}`}
                  onClick={() => selectWatchlistById(w.id)}
                  style={{ width: "100%", textAlign: "left", borderRadius: "var(--radius-sm)", borderLeft: "none" }}
                >
                  👁 {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Watchlist Details */}
          <div>
            {selectedWatchlist ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{selectedWatchlist.name}</h2>
                    <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {selectedWatchlist.stocks?.length || 0} stocks tracked
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddStockModal(true)}>
                      + Add Stock
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteWatchlist(selectedWatchlist.id)}
                    >
                      Delete Watchlist
                    </button>
                  </div>
                </div>

                {!selectedWatchlist.stocks || selectedWatchlist.stocks.length === 0 ? (
                  <EmptyState icon="📈" message="No stocks in this watchlist. Click '+ Add Stock' to track a symbol." />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Live Price</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWatchlist.stocks.map((st) => (
                          <tr key={st.id}>
                            <td style={{ fontWeight: 700, color: "var(--accent)" }}>{st.symbol}</td>
                            <td style={{ fontWeight: 600 }}>
                              {st.currentPrice !== null && st.currentPrice !== undefined ? (
                                `$${st.currentPrice.toFixed(2)}`
                              ) : (
                                <span className="text-muted">Unavailable</span>
                              )}
                            </td>
                            <td className="text-right">
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveStock(st.symbol)}
                                aria-label={`Remove ${st.symbol}`}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState icon="👈" message="Select a watchlist from the left sidebar to view stocks." />
            )}
          </div>
        </div>
      )}

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <Modal title="Create New Watchlist" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateWatchlist}>
            <div className="form-group">
              <label className="form-label" htmlFor="watchlistName">Watchlist Name</label>
              <input
                id="watchlistName"
                type="text"
                className="form-input"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="e.g. Tech Giants, EV Stocks"
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
                {submitting ? "Creating..." : "Create Watchlist"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedWatchlist && (
        <Modal title={`Add Stock to ${selectedWatchlist.name}`} onClose={() => setShowAddStockModal(false)}>
          <form onSubmit={handleAddStock}>
            <div className="form-group">
              <label className="form-label" htmlFor="stockSymbol">Stock Ticker Symbol</label>
              <input
                id="stockSymbol"
                type="text"
                className="form-input"
                value={newStockSymbol}
                onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL, NVDA, AMZN"
                required
                maxLength={10}
                autoFocus
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
                {submitting ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

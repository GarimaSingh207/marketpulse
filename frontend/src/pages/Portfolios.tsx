import { useEffect, useState, useCallback, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

interface PortfolioWithValue extends Portfolio {
  liveValue?: number;
}

export default function Portfolios() {
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<PortfolioWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<Portfolio[]>("/api/portfolios");
      const list = res.data;

      // Fetch valuations for each portfolio
      const withValues = await Promise.all(
        list.map(async (p) => {
          try {
            const valRes = await api.get<PortfolioValue>(`/api/portfolios/${p.id}/value`);
            return { ...p, liveValue: valRes.data.totalValue };
          } catch {
            return { ...p, liveValue: 0 };
          }
        })
      );

      setPortfolios(withValues);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load portfolios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  // Socket.IO event handling
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchPortfolios();
    };

    socket.on("portfolio:created", handleUpdate);
    socket.on("portfolio:deleted", handleUpdate);
    socket.on("holding:created", handleUpdate);
    socket.on("holding:deleted", handleUpdate);
    socket.on("transaction:created", handleUpdate);
    socket.on("portfolio:valueUpdated", handleUpdate);

    return () => {
      socket.off("portfolio:created", handleUpdate);
      socket.off("portfolio:deleted", handleUpdate);
      socket.off("holding:created", handleUpdate);
      socket.off("holding:deleted", handleUpdate);
      socket.off("transaction:created", handleUpdate);
      socket.off("portfolio:valueUpdated", handleUpdate);
    };
  }, [socket, fetchPortfolios]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/portfolios", { name: newPortfolioName.trim() });
      setNewPortfolioName("");
      setShowCreateModal(false);
      fetchPortfolios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create portfolio.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio? All holdings will be removed.")) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/api/portfolios/${id}`);
      fetchPortfolios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete portfolio.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolios</h1>
          <p className="text-muted">Manage your investment portfolios and track performance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Portfolio
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {portfolios.length === 0 ? (
        <EmptyState icon="💼" message="No portfolios found. Click 'Create Portfolio' to get started." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {portfolios.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{p.name}</h3>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    aria-label={`Delete portfolio ${p.name}`}
                  >
                    {deletingId === p.id ? "..." : "Delete"}
                  </button>
                </div>
                <p className="stat-value text-green" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                  ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {p.holdings?.length || 0} holdings
                </p>
              </div>

              <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                <Link to={`/portfolios/${p.id}`} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                  Manage Portfolio →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <Modal title="Create New Portfolio" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="portfolioName">Portfolio Name</label>
              <input
                id="portfolioName"
                type="text"
                className="form-input"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="e.g. Growth Portfolio, Retirement"
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
                {submitting ? "Creating..." : "Create Portfolio"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

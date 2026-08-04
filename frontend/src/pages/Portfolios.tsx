import { useEffect, useState, useCallback, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Plus, Trash2, ArrowRight, Briefcase, BarChart3 } from "lucide-react";

interface PortfolioWithValue extends Portfolio {
  liveValue?: number;
}

export default function Portfolios() {
  const { socket } = useSocket();

  const [portfolios, setPortfolios] = useState<PortfolioWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Deletion Confirm Dialog state
  const [portfolioToDelete, setPortfolioToDelete] = useState<{ id: string; name: string } | null>(null);
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

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchPortfolios();
    };

    const events = [
      "portfolio:created",
      "portfolio:deleted",
      "holding:created",
      "holding:deleted",
      "portfolio:valueUpdated",
    ];

    events.forEach((event) => socket.on(event, handleUpdate));
    return () => {
      events.forEach((event) => socket.off(event, handleUpdate));
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

  const executeDelete = async () => {
    if (!portfolioToDelete) return;
    const { id } = portfolioToDelete;

    setDeletingId(id);
    setPortfolioToDelete(null);
    try {
      await api.delete(`/api/portfolios/${id}`);
      fetchPortfolios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete portfolio.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Spinner text="Loading portfolios…" />;

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
          <h1 className="page-title">Portfolios</h1>
          <p className="page-subtitle">Track valuations, aggregate live returns, and configure asset allocations.</p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Portfolio</span>
        </motion.button>
      </motion.div>

      {error && <ErrorBanner message={error} />}

      {portfolios.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="No Active Portfolios"
          message="Create a new portfolio shell to start recording buy and sell transactions."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} /> Get Started
            </button>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}
        >
          {portfolios.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } },
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="card card-accent"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "200px" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="stat-card-icon accent" style={{ width: "30px", height: "30px", marginBottom: 0 }}>
                      <Briefcase size={14} />
                    </div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      {p.name}
                    </h3>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-danger btn-sm"
                    onClick={() => setPortfolioToDelete({ id: p.id, name: p.name })}
                    disabled={deletingId === p.id}
                    aria-label={`Delete portfolio ${p.name}`}
                    style={{ padding: "0.4rem", borderRadius: "var(--r-sm)" }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </div>

                <div style={{ margin: "0.75rem 0" }}>
                  <span className="text-muted" style={{ fontSize: "0.72rem", display: "block", fontWeight: 600, letterSpacing: "0.02em" }}>
                    ESTIMATED LIVE VALUATION
                  </span>
                  <p className="stat-value text-profit text-mono" style={{ fontSize: "1.5rem", marginTop: "0.15rem" }}>
                    ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="badge badge-accent" style={{ fontSize: "0.7rem" }}>
                    {p.holdings?.length || 0} Positions
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <BarChart3 size={10} /> Allocations set
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                <Link
                  to={`/portfolios/${p.id}`}
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <span>Manage Portfolio</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Portfolio Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal title="Create New Portfolio" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="portfolioName">
                  Portfolio Identifier
                </label>
                <input
                  id="portfolioName"
                  type="text"
                  className="form-input"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="e.g. Liquid Capital, Retiresafe Fund"
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
      </AnimatePresence>

      {/* Confirm deletion dialog */}
      <ConfirmDialog
        open={portfolioToDelete !== null}
        title="Delete Portfolio"
        description={`Are you sure you want to delete the portfolio "${portfolioToDelete?.name}"? All holdings, positions, and associated transactions will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete Portfolio"
        onConfirm={executeDelete}
        onCancel={() => setPortfolioToDelete(null)}
      />
    </div>
  );
}

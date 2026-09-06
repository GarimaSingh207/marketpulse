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
import "./Portfolio.css";

interface PortfolioWithValue extends Portfolio {
  liveValue?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 25 },
  },
};

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

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

  // Aggregate summary stats
  const totalValue = portfolios.reduce((sum, p) => sum + (p.liveValue || 0), 0);
  const totalPositions = portfolios.reduce((sum, p) => sum + (p.holdings?.length || 0), 0);

  return (
    <div className="portfolio-full-bleed">
      <div className="portfolio-root">
        <div className="portfolio-inner">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <motion.div
            className="portfolio-page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <h1 className="portfolio-page-title">Portfolios</h1>
              <p className="portfolio-page-subtitle">
                Track valuations, aggregate live returns, and configure asset allocations.
              </p>
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="portfolio-btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Create Portfolio</span>
            </motion.button>
          </motion.div>

          {error && <ErrorBanner message={error} />}

          {/* ── Summary Ribbon ──────────────────────────────────────────── */}
          {portfolios.length > 0 && (
            <motion.div
              className="portfolio-summary-ribbon"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="portfolio-summary-card">
                <p className="portfolio-summary-label">Total Portfolio Value</p>
                <p className="portfolio-summary-value">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="portfolio-summary-card">
                <p className="portfolio-summary-label">Active Portfolios</p>
                <p className="portfolio-summary-value neutral">{portfolios.length}</p>
              </div>
              <div className="portfolio-summary-card">
                <p className="portfolio-summary-label">Total Positions</p>
                <p className="portfolio-summary-value neutral">{totalPositions}</p>
              </div>
            </motion.div>
          )}

          {/* ── Portfolio Grid / Empty State ────────────────────────────── */}
          {portfolios.length === 0 ? (
            <EmptyState
              icon={<Briefcase size={24} />}
              title="No Active Portfolios"
              message="Create a new portfolio shell to start recording buy and sell transactions."
              action={
                <button
                  className="portfolio-btn-create"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={15} /> Get Started
                </button>
              }
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={gridVariants}
              className="portfolio-grid"
            >
              {portfolios.map((p) => (
                <motion.div
                  key={p.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="port-card"
                >
                  {/* Card Header: icon + name + delete */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="port-card-icon">
                          <Briefcase size={15} />
                        </div>
                        <div>
                          <h3 className="port-card-name">{p.name}</h3>
                          <span className="port-card-id">ID: {p.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        style={{
                          color: "var(--port-on-surface-variant)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          transition: "color 0.2s, background 0.2s",
                          lineHeight: 0,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--port-error)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 180, 171, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--port-on-surface-variant)";
                          (e.currentTarget as HTMLButtonElement).style.background = "none";
                        }}
                        onClick={() => setPortfolioToDelete({ id: p.id, name: p.name })}
                        disabled={deletingId === p.id}
                        aria-label={`Delete portfolio ${p.name}`}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>

                    {/* Valuation */}
                    <div style={{ margin: "1rem 0" }}>
                      <span className="port-card-valuation-label">Estimated Live Valuation</span>
                      <p className="port-card-value">
                        ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <span className="port-badge port-badge-positions">
                        {p.holdings?.length || 0} Positions
                      </span>
                      <span className="port-badge port-badge-alloc">
                        <BarChart3 size={10} /> Allocations set
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Manage link */}
                  <div className="port-card-footer">
                    <Link
                      to={`/portfolios/${p.id}`}
                      className="port-manage-link"
                    >
                      <span>Manage Portfolio</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      {/* ── Create Portfolio Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal title="Create New Portfolio" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreate}>
              <div className="form-group mb-6">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="portfolioName">
                  Portfolio Identifier
                </label>
                <input
                  id="portfolioName"
                  type="text"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="e.g. Liquid Capital, Retiresafe Fund"
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
                <button
                  type="submit"
                  className="portfolio-btn-create"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Portfolio"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Confirm deletion dialog ───────────────────────────────────────── */}
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

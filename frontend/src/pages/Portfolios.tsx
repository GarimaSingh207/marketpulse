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
    <div className="portfolio-root">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant/10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="font-headline-sm text-2xl font-bold tracking-tight text-on-surface">Portfolios</h1>
          <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant mt-1">
            Track valuations, aggregate live returns, and configure asset allocations.
          </p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-primary text-on-primary py-2.5 px-6 font-label-caps text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all rounded"
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
            <button
              className="bg-primary text-on-primary py-2 px-4 font-label-caps text-xs font-bold flex items-center gap-2 rounded hover:opacity-90 active:scale-95 transition-all"
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
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {portfolios.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } },
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="port-card flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-zinc-900 border border-outline-variant/20 flex items-center justify-center text-primary shrink-0">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <h3 className="font-body-md font-semibold text-on-surface">{p.name}</h3>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        ID: {p.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-on-surface-variant hover:text-error transition-all p-2 rounded hover:bg-surface-variant/30"
                    onClick={() => setPortfolioToDelete({ id: p.id, name: p.name })}
                    disabled={deletingId === p.id}
                    aria-label={`Delete portfolio ${p.name}`}
                  >
                    <Trash2 size={15} />
                  </motion.button>
                </div>

                <div className="my-4">
                  <span className="text-on-surface-variant font-label-caps text-[9px] uppercase tracking-wider block">
                    ESTIMATED LIVE VALUATION
                  </span>
                  <p className="text-2xl text-primary font-bold port-text-mono mt-1">
                    ${(p.liveValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex gap-2 items-center mt-3">
                  <span className="text-[10px] font-label-caps bg-surface-variant/40 px-2.5 py-1 rounded text-on-surface">
                    {p.holdings?.length || 0} Positions
                  </span>
                  <span className="text-[10px] font-label-caps bg-[#34d399]/10 px-2.5 py-1 rounded text-[#34d399] flex items-center gap-1">
                    <BarChart3 size={11} /> Allocations set
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/10">
                <Link
                  to={`/portfolios/${p.id}`}
                  className="w-full bg-transparent border border-outline-variant/20 hover:border-primary/45 hover:text-primary transition-all text-on-surface text-center py-2.5 px-4 font-label-caps text-xs font-bold flex items-center justify-center gap-2 rounded"
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
                  className="bg-primary text-on-primary py-2.5 px-5 font-label-caps text-xs font-bold rounded hover:opacity-90 active:scale-95 transition-all"
                  disabled={submitting}
                >
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

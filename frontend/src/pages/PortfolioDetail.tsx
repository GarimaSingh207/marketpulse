import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue, Holding, Transaction } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Plus,
  TrendingUp,
  History,
  Trash2,
  DollarSign,
  TrendingDown,
  Calendar,
  Briefcase,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [valData, setValData] = useState<PortfolioValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [holdingSymbol, setHoldingSymbol] = useState("");
  const [holdingQty, setHoldingQty] = useState("");
  const [holdingAvgPrice, setHoldingAvgPrice] = useState("");

  const [selectedHoldingForTx, setSelectedHoldingForTx] = useState<Holding | null>(null);
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");

  // Custom Confirm Dialog for Holding deletion
  const [holdingToDelete, setHoldingToDelete] = useState<{ id: string; symbol: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [portRes, valRes] = await Promise.all([
        api.get<Portfolio[]>("/api/portfolios"),
        api.get<PortfolioValue>(`/api/portfolios/${id}/value`).catch(() => null),
      ]);

      const found = portRes.data.find((p) => p.id === id);
      if (!found) {
        setError("Portfolio not found.");
        return;
      }

      setPortfolio(found);
      setValData(valRes?.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load portfolio details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Socket.IO event listener
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDetail();
    };

    const events = [
      "holding:created",
      "holding:deleted",
      "transaction:created",
      "portfolio:valueUpdated",
    ];

    events.forEach((event) => socket.on(event, handleUpdate));
    return () => {
      events.forEach((event) => socket.off(event, handleUpdate));
    };
  }, [socket, fetchDetail]);

  const handleAddHolding = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !holdingSymbol || !holdingQty || !holdingAvgPrice) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/portfolios/${id}/holdings`, {
        symbol: holdingSymbol.trim().toUpperCase(),
        quantity: parseFloat(holdingQty),
        averagePrice: parseFloat(holdingAvgPrice),
      });

      setHoldingSymbol("");
      setHoldingQty("");
      setHoldingAvgPrice("");
      setShowAddHoldingModal(false);
      fetchDetail();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0] || "Failed to add holding."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHolding = async () => {
    if (!holdingToDelete) return;
    const holdingId = holdingToDelete.id;
    setHoldingToDelete(null);

    try {
      await api.delete(`/api/holdings/${holdingId}`);
      fetchDetail();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete holding.");
    }
  };

  const handleCreateTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedHoldingForTx || !txQty || !txPrice) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/holdings/${selectedHoldingForTx.id}/transactions`, {
        type: txType,
        quantity: parseFloat(txQty),
        price: parseFloat(txPrice),
      });

      setSelectedHoldingForTx(null);
      setTxQty("");
      setTxPrice("");
      fetchDetail();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner text="Fetching holdings detail…" />;
  if (!portfolio) return <ErrorBanner message={error || "Portfolio not found."} />;

  // Calculate overall metrics
  const totalCost = portfolio.holdings.reduce(
    (acc, h) => acc + h.quantity * Number(h.averagePrice),
    0
  );
  const totalMarketVal = valData?.totalValue || 0;
  const totalGainLoss = totalMarketVal - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Flatten all transactions for history view
  const allTransactions: (Transaction & { symbol: string })[] = [];
  portfolio.holdings.forEach((h) => {
    if (h.transactions) {
      h.transactions.forEach((t) => {
        allTransactions.push({ ...t, symbol: h.symbol });
      });
    }
  });
  allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Performance chart data
  const chartData = portfolio.holdings.map((h) => {
    const livePrice =
      valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
      Number(h.averagePrice);
    return {
      symbol: h.symbol,
      cost: Number((h.quantity * Number(h.averagePrice)).toFixed(2)),
      market: Number((h.quantity * livePrice).toFixed(2)),
    };
  });

  return (
    <div className="section-gap">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div className="breadcrumb">
            <Link to="/portfolios" className="breadcrumb-link">
              Portfolios
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span>Detail</span>
          </div>
          <h1 className="page-title">{portfolio.name}</h1>
          <p className="page-subtitle">Granular live performance metrics and historic transaction records.</p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => setShowAddHoldingModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Holding</span>
        </motion.button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Metrics Row */}
      <div className="stat-grid">
        <StatCard
          label="Market Value"
          value={`$${totalMarketVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          valueClass="text-profit mono"
          sub="Live cached valuation"
          icon={<DollarSign size={16} />}
          iconVariant="profit"
        />
        <StatCard
          label="Cost Basis"
          value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          valueClass="mono"
          sub="Total invested capital"
          icon={<Briefcase size={16} />}
          iconVariant="accent"
        />
        <StatCard
          label="Net Returns"
          value={`${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub={`${totalGainLossPercent >= 0 ? "+" : ""}${totalGainLossPercent.toFixed(2)}% net change`}
          valueClass={totalGainLoss >= 0 ? "text-profit mono" : "text-loss mono"}
          icon={totalGainLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          iconVariant={totalGainLoss >= 0 ? "profit" : "loss"}
        />
        <StatCard
          label="Positions"
          value={portfolio.holdings.length}
          sub="Unique asset positions"
          icon={<Layers size={16} />}
          iconVariant="warn"
        />
      </div>

      {/* Allocation breakdown chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="card"
        >
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={16} className="text-muted" />
              <h2 className="card-title">Assets Allocation (Cost vs Market Value)</h2>
            </div>
          </div>
          <div style={{ width: "100%", height: "180px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--profit)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--profit)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  contentStyle={{
                    background: "var(--overlay-strong)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "var(--r-md)",
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                  }}
                />
                <Area type="monotone" dataKey="cost" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCost)" name="Cost Basis" />
                <Area type="monotone" dataKey="market" stroke="var(--profit)" fillOpacity={1} fill="url(#colorMarket)" name="Market Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Holdings & Live Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="card"
      >
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={16} className="text-muted" />
            <h2 className="card-title">Holdings Performance</h2>
          </div>
        </div>

        {portfolio.holdings.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No Positions Tracked"
            message="You haven't added any stocks to this portfolio. Tap '+ Add Holding' to record your initial assets."
            action={
              <button className="btn btn-primary" onClick={() => setShowAddHoldingModal(true)}>
                <Plus size={14} /> Add First Position
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Cost</th>
                  <th>Live Price</th>
                  <th>Market Value</th>
                  <th>Net Returns</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => {
                  const livePrice =
                    valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
                    Number(h.averagePrice);
                  const mktVal = h.quantity * livePrice;
                  const cost = h.quantity * Number(h.averagePrice);
                  const pnl = mktVal - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

                  return (
                    <tr key={h.id}>
                      <td className="table-symbol">{h.symbol}</td>
                      <td className="text-mono" style={{ fontSize: "0.85rem", fontWeight: 500 }}>{h.quantity}</td>
                      <td className="table-price">${Number(h.averagePrice).toFixed(2)}</td>
                      <td className="table-price">${livePrice.toFixed(2)}</td>
                      <td className="text-mono" style={{ fontWeight: 600, fontSize: "0.85rem" }}>${mktVal.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${pnl >= 0 ? "badge-profit" : "badge-loss"}`} style={{ fontSize: "0.72rem" }}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedHoldingForTx(h);
                              setTxType("BUY");
                              setTxQty("");
                              setTxPrice(livePrice.toFixed(2));
                            }}
                          >
                            Trade
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-danger btn-sm"
                            onClick={() => setHoldingToDelete({ id: h.id, symbol: h.symbol })}
                            aria-label={`Delete holding ${h.symbol}`}
                            style={{ padding: "0.4rem" }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Transaction History Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="card"
      >
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={16} className="text-muted" />
            <h2 className="card-title">Transaction History</h2>
          </div>
        </div>

        {allTransactions.length === 0 ? (
          <EmptyState icon="📜" message="No transaction history logged for this portfolio." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th className="text-right">Net Value</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-muted text-mono" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Calendar size={11} /> {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-symbol">{tx.symbol}</td>
                    <td>
                      <span className={`badge ${tx.type === "BUY" ? "badge-profit" : "badge-warn"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-mono" style={{ fontSize: "0.825rem" }}>{tx.quantity}</td>
                    <td className="table-price">${Number(tx.price).toFixed(2)}</td>
                    <td className="text-mono text-right" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      ${(tx.quantity * Number(tx.price)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Holding Modal */}
      <AnimatePresence>
        {showAddHoldingModal && (
          <Modal title="Add Stock Position" onClose={() => setShowAddHoldingModal(false)}>
            <form onSubmit={handleAddHolding}>
              <div className="form-group">
                <label className="form-label" htmlFor="symbol">
                  Stock Symbol (Ticker)
                </label>
                <input
                  id="symbol"
                  type="text"
                  className="form-input"
                  value={holdingSymbol}
                  onChange={(e) => setHoldingSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, NVDA, TSLA"
                  required
                  maxLength={10}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="quantity">
                  Share Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  step="any"
                  min="0.0001"
                  className="form-input"
                  value={holdingQty}
                  onChange={(e) => setHoldingQty(e.target.value)}
                  placeholder="e.g. 10.0"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="averagePrice">
                  Average Executed Price ($)
                </label>
                <input
                  id="averagePrice"
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-input"
                  value={holdingAvgPrice}
                  onChange={(e) => setHoldingAvgPrice(e.target.value)}
                  placeholder="e.g. 172.50"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddHoldingModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Processing..." : "Add Position"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Trade (Buy/Sell Transaction) Modal */}
      <AnimatePresence>
        {selectedHoldingForTx && (
          <Modal
            title={`Trade Executions for ${selectedHoldingForTx.symbol}`}
            onClose={() => setSelectedHoldingForTx(null)}
          >
            <form onSubmit={handleCreateTransaction}>
              <div className="form-group">
                <label className="form-label">Execution Order Type</label>
                <div className="radio-group">
                  <label className={`radio-option ${txType === "BUY" ? "selected-buy" : ""}`}>
                    <input
                      type="radio"
                      name="txType"
                      value="BUY"
                      checked={txType === "BUY"}
                      onChange={() => setTxType("BUY")}
                    />
                    <span>BUY ORDER</span>
                  </label>
                  <label className={`radio-option ${txType === "SELL" ? "selected-sell" : ""}`}>
                    <input
                      type="radio"
                      name="txType"
                      value="SELL"
                      checked={txType === "SELL"}
                      onChange={() => setTxType("SELL")}
                    />
                    <span>SELL ORDER</span>
                  </label>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label" htmlFor="txQuantity">
                  Order Quantity
                </label>
                <input
                  id="txQuantity"
                  type="number"
                  step="any"
                  min="0.0001"
                  max={txType === "SELL" ? selectedHoldingForTx.quantity : undefined}
                  className="form-input"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  placeholder={`Max Sell limit: ${selectedHoldingForTx.quantity}`}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="txPrice">
                  Order Price per Unit ($)
                </label>
                <input
                  id="txPrice"
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-input"
                  value={txPrice}
                  onChange={(e) => setTxPrice(e.target.value)}
                  placeholder="Market price"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedHoldingForTx(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Executing..." : `Place ${txType} Order`}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Custom Confirm Dialog for deleting a position */}
      <ConfirmDialog
        open={holdingToDelete !== null}
        title="Remove Asset Position"
        description={`Are you sure you want to remove the holding position "${holdingToDelete?.symbol}"? Doing so will permanently wipe its entire transaction logs from this portfolio. This cannot be undone.`}
        confirmLabel="Remove Holding"
        onConfirm={handleDeleteHolding}
        onCancel={() => setHoldingToDelete(null)}
      />
    </div>
  );
}

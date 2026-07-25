import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue, Holding, Transaction } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";

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

    socket.on("holding:created", handleUpdate);
    socket.on("holding:deleted", handleUpdate);
    socket.on("transaction:created", handleUpdate);
    socket.on("portfolio:valueUpdated", handleUpdate);

    return () => {
      socket.off("holding:created", handleUpdate);
      socket.off("holding:deleted", handleUpdate);
      socket.off("transaction:created", handleUpdate);
      socket.off("portfolio:valueUpdated", handleUpdate);
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
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || "Failed to add holding.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm("Delete this holding? All associated transactions will be removed.")) return;
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

  if (loading) return <Spinner />;
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

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <Link to="/portfolios" className="text-muted" style={{ fontSize: "0.9rem" }}>
              ← Portfolios
            </Link>
          </div>
          <h1 className="page-title">{portfolio.name}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddHoldingModal(true)}>
          + Add Holding
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="stat-grid">
        <StatCard
          label="Total Market Value"
          value={`$${totalMarketVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          valueClass="text-green"
          sub="Live Finnhub market value"
        />
        <StatCard
          label="Total Cost Basis"
          value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub="Total invested amount"
        />
        <StatCard
          label="Total Gain / Loss"
          value={`${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub={`${totalGainLossPercent >= 0 ? "+" : ""}${totalGainLossPercent.toFixed(2)}% total return`}
          valueClass={totalGainLoss >= 0 ? "text-green" : "text-red"}
        />
        <StatCard label="Total Holdings" value={portfolio.holdings.length} sub="Unique positions" />
      </div>

      {/* Holdings Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Holdings & Live Performance</h2>
        </div>

        {portfolio.holdings.length === 0 ? (
          <EmptyState icon="📊" message="No holdings in this portfolio yet. Click '+ Add Holding' to add your first asset." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Buy Price</th>
                  <th>Current Price</th>
                  <th>Market Value</th>
                  <th>Gain / Loss</th>
                  <th className="text-right">Actions</th>
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
                      <td style={{ fontWeight: 700, color: "var(--accent)" }}>{h.symbol}</td>
                      <td>{h.quantity}</td>
                      <td>${Number(h.averagePrice).toFixed(2)}</td>
                      <td>${livePrice.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${mktVal.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${pnl >= 0 ? "badge-green" : "badge-red"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
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
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteHolding(h.id)}
                            aria-label={`Delete holding ${h.symbol}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transaction History</h2>
        </div>

        {allTransactions.length === 0 ? (
          <EmptyState icon="📜" message="No transaction history available." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-muted">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{tx.symbol}</td>
                    <td>
                      <span className={`badge ${tx.type === "BUY" ? "badge-green" : "badge-yellow"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td>{tx.quantity}</td>
                    <td>${Number(tx.price).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${(tx.quantity * Number(tx.price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      {showAddHoldingModal && (
        <Modal title="Add Holding to Portfolio" onClose={() => setShowAddHoldingModal(false)}>
          <form onSubmit={handleAddHolding}>
            <div className="form-group">
              <label className="form-label" htmlFor="symbol">Stock Ticker Symbol</label>
              <input
                id="symbol"
                type="text"
                className="form-input"
                value={holdingSymbol}
                onChange={(e) => setHoldingSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL, TSLA, MSFT"
                required
                maxLength={10}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                step="any"
                min="0.0001"
                className="form-input"
                value={holdingQty}
                onChange={(e) => setHoldingQty(e.target.value)}
                placeholder="e.g. 10"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="averagePrice">Average Buy Price ($)</label>
              <input
                id="averagePrice"
                type="number"
                step="any"
                min="0.01"
                className="form-input"
                value={holdingAvgPrice}
                onChange={(e) => setHoldingAvgPrice(e.target.value)}
                placeholder="e.g. 150.25"
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
                {submitting ? "Adding..." : "Add Holding"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Trade (Buy/Sell Transaction) Modal */}
      {selectedHoldingForTx && (
        <Modal
          title={`Trade ${selectedHoldingForTx.symbol}`}
          onClose={() => setSelectedHoldingForTx(null)}
        >
          <form onSubmit={handleCreateTransaction}>
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="txType"
                    value="BUY"
                    checked={txType === "BUY"}
                    onChange={() => setTxType("BUY")}
                  />
                  BUY (Add Shares)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="txType"
                    value="SELL"
                    checked={txType === "SELL"}
                    onChange={() => setTxType("SELL")}
                  />
                  SELL (Reduce Shares)
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="txQuantity">Quantity</label>
              <input
                id="txQuantity"
                type="number"
                step="any"
                min="0.0001"
                max={txType === "SELL" ? selectedHoldingForTx.quantity : undefined}
                className="form-input"
                value={txQty}
                onChange={(e) => setTxQty(e.target.value)}
                placeholder={`Current quantity: ${selectedHoldingForTx.quantity}`}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="txPrice">Price per Share ($)</label>
              <input
                id="txPrice"
                type="number"
                step="any"
                min="0.01"
                className="form-input"
                value={txPrice}
                onChange={(e) => setTxPrice(e.target.value)}
                placeholder="Execution price"
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
                {submitting ? "Processing..." : `Execute ${txType}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

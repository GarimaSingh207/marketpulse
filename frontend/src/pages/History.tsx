import { useEffect, useState, useCallback, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Portfolio, Transaction, PortfolioValue } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import {
  History as HistoryIcon,
  Search,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  ShoppingCart,
} from "lucide-react";
import "./History.css";

interface FlatTransaction extends Transaction {
  symbol: string;
  portfolioName: string;
  portfolioId: string;
}

export default function History() {
  const navigate = useNavigate();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [transactions, setTransactions] = useState<FlatTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary Metrics
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [valFailed, setValFailed] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("Portfolio: All");
  const [selectedType, setSelectedType] = useState("Type: All");
  const [sortBy, setSortBy] = useState("Sort: Date (Newest)");

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(15);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all portfolios
      const portRes = await api.get<Portfolio[]>("/api/portfolios");
      const portList = portRes.data;
      setPortfolios(portList);

      // Flatten transactions
      const txList: FlatTransaction[] = [];
      let investedSum = 0;

      portList.forEach((p) => {
        p.holdings.forEach((h) => {
          investedSum += h.quantity * Number(h.averagePrice);
          if (h.transactions) {
            h.transactions.forEach((t) => {
              txList.push({
                ...t,
                symbol: h.symbol,
                portfolioName: p.name,
                portfolioId: p.id,
              });
            });
          }
        });
      });

      // Sort initially by date newest
      txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(txList);
      setTotalInvested(investedSum);

      // Fetch values for each portfolio to calculate total market value
      const valuePromises = portList.map((p) =>
        api.get<PortfolioValue>(`/api/portfolios/${p.id}/value`).catch(() => null)
      );
      const valueResponses = await Promise.all(valuePromises);
      let valueSum = 0;
      let hasFailedVal = false;
      valueResponses.forEach((val) => {
        if (val) {
          valueSum += val.data.totalValue;
        } else {
          hasFailedVal = true;
        }
      });
      
      if (portList.length > 0 && hasFailedVal) {
        setValFailed(true);
      } else {
        setTotalValue(valueSum);
        setValFailed(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load transaction history logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute filtered & sorted transactions
  const getProcessedTransactions = () => {
    let list = [...transactions];

    // Filter by symbol/portfolio search
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase();
      list = list.filter(
        (t) =>
          t.symbol.toUpperCase().includes(q) ||
          t.portfolioName.toUpperCase().includes(q)
      );
    }

    // Filter by portfolio select
    if (selectedPortfolioId !== "Portfolio: All") {
      list = list.filter((t) => t.portfolioId === selectedPortfolioId);
    }

    // Filter by buy/sell type
    if (selectedType !== "Type: All") {
      list = list.filter((t) => t.type === selectedType);
    }

    // Sorting
    if (sortBy === "Sort: Date (Newest)") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Sort: Date (Oldest)") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "Sort: Size (High-Low)") {
      list.sort((a, b) => (b.quantity * Number(b.price)) - (a.quantity * Number(a.price)));
    } else if (sortBy === "Sort: Symbol (A-Z)") {
      list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return list;
  };

  const processedList = getProcessedTransactions();
  const visibleList = processedList.slice(0, visibleCount);

  // Group visible transactions by date for grouped display
  const groupTransactionsByDate = (txs: FlatTransaction[]) => {
    const groups: Record<string, FlatTransaction[]> = {};
    txs.forEach((tx) => {
      const dateStr = new Date(tx.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });
    return groups;
  };

  const groupedTxs = groupTransactionsByDate(visibleList);
  const totalPnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  if (loading && transactions.length === 0) return <Spinner text="Loading transaction ledgers…" />;

  return (
    <div className="hist-root hist-stagger-load">
      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-label-caps text-on-surface-variant mb-2">
            <Link to="/portfolios" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft size={12} />
              <span>Portfolios</span>
            </Link>
            <span>/</span>
            <span className="text-on-surface text-[10px]">Audit Logs</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Transaction Ledger</h1>
          <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant mt-1">
            Complete historic transaction records and execution log auditting.
          </p>
        </div>
        <button
          className="text-on-surface-variant hover:text-primary transition-all p-2 rounded hover:bg-surface-variant/30 flex items-center gap-2"
          onClick={fetchData}
          title="Refresh Ledger"
        >
          <RefreshCw size={15} />
        </button>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* Summary Bento Grid Ribbon */}
      <section className="flex flex-wrap items-center gap-4 mb-8">
        <div className="hist-bento-card">
          <p className="font-label-caps text-[9px] text-on-surface-variant/50 mb-1 uppercase tracking-wider">
            Total Portfolio Value
          </p>
          <h2 className="font-mono text-2xl font-bold text-primary tracking-tight">
            {valFailed ? (
              "N/A"
            ) : (
              `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </h2>
        </div>
        <div className="hist-bento-card">
          <p className="font-label-caps text-[9px] text-on-surface-variant/50 mb-1 uppercase tracking-wider">
            Total Cost Basis
          </p>
          <h2 className="font-mono text-2xl font-bold text-on-surface tracking-tight">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="hist-bento-card">
          <p className="font-label-caps text-[9px] text-on-surface-variant/50 mb-1 uppercase tracking-wider">
            Unrealized P&L
          </p>
          {valFailed ? (
            <h2 className="font-mono text-2xl font-bold text-on-surface-variant/40 mt-1">N/A</h2>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <h2 className={`font-mono text-2xl font-bold ${totalPnl >= 0 ? "text-hist-emerald" : "text-hist-error"}`}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span
                className={`flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  totalPnl >= 0 ? "bg-hist-emerald/10 text-hist-emerald" : "bg-hist-error/10 text-hist-error"
                }`}
              >
                {totalPnl >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {pnlPercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="hist-bento-card max-w-[180px]">
          <p className="font-label-caps text-[9px] text-on-surface-variant/50 mb-1 uppercase tracking-wider">
            Audit Records
          </p>
          <h2 className="font-mono text-2xl font-bold text-on-surface tracking-tight">
            {transactions.length}
          </h2>
        </div>
      </section>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={24} />}
          title="No Logs Available"
          message="Transaction logs are empty. Buy or sell shares to log history records."
        />
      ) : (
        <div className="space-y-4">
          {/* Advanced Toolbar & Filters strip */}
          <div className="hist-filter-strip">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-primary" />
              <input
                type="text"
                placeholder="Search Symbol or Portfolio..."
                className="hist-filter-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="hist-filter-select"
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
            >
              <option value="Portfolio: All">Portfolio: All</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="hist-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="Type: All">Type: All</option>
              <option value="BUY">BUY Only</option>
              <option value="SELL">SELL Only</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase">
                Sort
              </span>
              <select
                className="hist-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Sort: Date (Newest)">Date (Newest)</option>
                <option value="Sort: Date (Oldest)">Date (Oldest)</option>
                <option value="Sort: Size (High-Low)">Size (High-Low)</option>
                <option value="Sort: Symbol (A-Z)">Symbol (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Grouped Ledger Table card */}
          {processedList.length === 0 ? (
            <EmptyState
              icon={<Search size={22} />}
              title="No Matching Records"
              message="Adjust filters to search different transaction ledger entries."
            />
          ) : (
            <div className="hist-table-card">
              <div className="overflow-x-auto hist-custom-scrollbar">
                <table className="hist-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Symbol</th>
                      <th className="px-4 py-4">Portfolio</th>
                      <th className="px-4 py-4">Action</th>
                      <th className="px-4 py-4 text-right">Shares Quantity</th>
                      <th className="px-4 py-4 text-right">Price Per Share</th>
                      <th className="px-4 py-4 text-right">Total Net Value</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 hist-text-mono">
                    {Object.keys(groupedTxs).map((dateGroup) => (
                      <Fragment key={dateGroup}>
                        <tr className="hist-date-group-divider">
                          <td colSpan={7} className="hist-date-group-text">
                            {dateGroup}
                          </td>
                        </tr>
                        {groupedTxs[dateGroup].map((tx) => {
                          const netVal = tx.quantity * Number(tx.price);
                          return (
                            <tr
                              key={tx.id}
                              className="group hover:bg-surface-variant/10 transition-colors"
                            >
                              <td className="px-6 py-4 font-bold text-primary text-xs">
                                {tx.symbol}
                              </td>
                              <td className="px-4 py-4 text-xs text-on-surface-variant font-sans">
                                {tx.portfolioName}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                    tx.type === "BUY" ? "hist-badge-buy" : "hist-badge-sell"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right text-xs">
                                {tx.quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-4 py-4 text-right text-xs text-on-surface-variant">
                                ${Number(tx.price).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-4 py-4 text-right text-xs font-semibold">
                                ${netVal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    className="text-on-surface-variant hover:text-primary p-1.5"
                                    onClick={() => navigate(`/stock/${tx.symbol}`)}
                                    title="View Stock Workspace"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="text-on-surface-variant hover:text-primary p-1.5"
                                    onClick={() => navigate(`/stock/${tx.symbol}`)}
                                    title="Trade Stock"
                                  >
                                    <ShoppingCart size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination load more panel */}
              {processedList.length > visibleCount && (
                <div className="p-4 border-t border-white/10 bg-surface-container-high/50 flex justify-center">
                  <button
                    className="text-xs text-primary font-bold hover:underline tracking-wider uppercase"
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                  >
                    Load More Audit Records (Showing {visibleList.length} of {processedList.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

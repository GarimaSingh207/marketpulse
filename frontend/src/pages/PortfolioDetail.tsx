import { useEffect, useState, useCallback, FormEvent, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import type { Portfolio, PortfolioValue, Holding, Transaction } from "../types";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Plus,
  TrendingUp,
  History,
  Trash2,
  Layers,
  ArrowLeft,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import "./Portfolio.css";

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
  RELIANCE: {
    name: "Reliance Industries Ltd.",
    sector: "Energy"
  },
  TCS: {
    name: "Tata Consultancy Services",
    sector: "Technology"
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Consumer Cyclical"
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical"
  },
  GOOG: {
    name: "Alphabet Inc.",
    sector: "Technology"
  },
  NFLX: {
    name: "Netflix Inc.",
    sector: "Communication"
  },
  META: {
    name: "Meta Platforms Inc.",
    sector: "Technology"
  },
};

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [valData, setValData] = useState<PortfolioValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters/Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("Sector: All");
  const [selectedPL, setSelectedPL] = useState("P/L: All");
  const [sortBy, setSortBy] = useState("Sort: Value");

  // Price directions for flash animation
  const prevPricesRef = useRef<Record<string, number>>({});
  const [priceDirections, setPriceDirections] = useState<Record<string, "up" | "down" | null>>({});

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

  // Track price flashing direction
  useEffect(() => {
    if (!valData) return;
    const newDirections: Record<string, "up" | "down" | null> = {};
    let hasChanges = false;

    valData.holdings.forEach((vh) => {
      const prev = prevPricesRef.current[vh.symbol];
      if (prev !== undefined && prev !== vh.currentPrice) {
        newDirections[vh.symbol] = vh.currentPrice > prev ? "up" : "down";
        hasChanges = true;
      }
      prevPricesRef.current[vh.symbol] = vh.currentPrice;
    });

    if (hasChanges) {
      setPriceDirections((prevDir) => ({ ...prevDir, ...newDirections }));

      // Clear directions after animation duration (1.5s)
      const timer = setTimeout(() => {
        setPriceDirections({});
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [valData]);

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

  // Gather sectors
  const sectorValuations: Record<string, number> = {};
  portfolio.holdings.forEach((h) => {
    const livePrice =
      valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
      Number(h.averagePrice);
    const mktVal = h.quantity * livePrice;
    const sector = STOCK_METADATA[h.symbol]?.sector || "Other";
    sectorValuations[sector] = (sectorValuations[sector] || 0) + mktVal;
  });

  const sectors = ["Sector: All", ...Array.from(new Set(portfolio.holdings.map((h) => STOCK_METADATA[h.symbol]?.sector || "Other")))];

  // Filter & Sort holdings
  const filteredHoldings = portfolio.holdings.filter((h) => {
    const meta = STOCK_METADATA[h.symbol] || { name: h.symbol, sector: "Other" };
    const matchesSearch =
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector =
      selectedSector === "Sector: All" ||
      STOCK_METADATA[h.symbol]?.sector === selectedSector ||
      (selectedSector === "Other" && !STOCK_METADATA[h.symbol]);

    const livePrice =
      valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
      Number(h.averagePrice);
    const mktVal = h.quantity * livePrice;
    const cost = h.quantity * Number(h.averagePrice);
    const pnl = mktVal - cost;

    const matchesPL =
      selectedPL === "P/L: All" ||
      (selectedPL === "Profitable" && pnl >= 0) ||
      (selectedPL === "Losing" && pnl < 0);

    return matchesSearch && matchesSector && matchesPL;
  });

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    const aLivePrice =
      valData?.holdings.find((vh) => vh.symbol === a.symbol)?.currentPrice ||
      Number(a.averagePrice);
    const bLivePrice =
      valData?.holdings.find((vh) => vh.symbol === b.symbol)?.currentPrice ||
      Number(b.averagePrice);

    const aMktVal = a.quantity * aLivePrice;
    const bMktVal = b.quantity * bLivePrice;

    const aCost = a.quantity * Number(a.averagePrice);
    const bCost = b.quantity * Number(b.averagePrice);

    const aPnl = aMktVal - aCost;
    const bPnl = bMktVal - bCost;

    const aPnlPct = aCost > 0 ? (aPnl / aCost) * 100 : 0;
    const bPnlPct = bCost > 0 ? (bPnl / bCost) * 100 : 0;

    if (sortBy === "Sort: Value") {
      return bMktVal - aMktVal;
    } else if (sortBy === "Symbol") {
      return a.symbol.localeCompare(b.symbol);
    } else if (sortBy === "Change %") {
      return bPnlPct - aPnlPct;
    } else if (sortBy === "P/L Amount") {
      return bPnl - aPnl;
    }
    return 0;
  });

  // Calculate Exposure, Leaders, Sectors, Risk Score
  let largestHoldingSymbol = "N/A";
  let largestWeight = 0;
  if (portfolio.holdings.length > 0 && totalMarketVal > 0) {
    portfolio.holdings.forEach((h) => {
      const livePrice =
        valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
        Number(h.averagePrice);
      const mktVal = h.quantity * livePrice;
      const weight = (mktVal / totalMarketVal) * 100;
      if (weight > largestWeight) {
        largestWeight = weight;
        largestHoldingSymbol = h.symbol;
      }
    });
  }

  const sortedByGain = [...portfolio.holdings]
    .map((h) => {
      const livePrice =
        valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
        Number(h.averagePrice);
      const mktVal = h.quantity * livePrice;
      const cost = h.quantity * Number(h.averagePrice);
      const pnl = mktVal - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { symbol: h.symbol, pnlPct, name: STOCK_METADATA[h.symbol]?.name || h.symbol };
    })
    .sort((a, b) => b.pnlPct - a.pnlPct);

  const topGainer = sortedByGain[0] || null;
  const worstLoser = sortedByGain.length > 1 ? sortedByGain[sortedByGain.length - 1] : null;

  const sectorWeights = Object.entries(sectorValuations)
    .map(([sector, val]) => {
      const weight = totalMarketVal > 0 ? (val / totalMarketVal) * 100 : 0;
      return { sector, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  // Dynamic Diversification Score
  const uniqueAssets = portfolio.holdings.length;
  const uniqueSectors = Object.keys(sectorValuations).length;
  let score = Math.min(uniqueAssets * 10 + uniqueSectors * 15, 85);
  if (largestWeight > 0 && largestWeight <= 30) {
    score += 15;
  } else if (largestWeight > 0 && largestWeight <= 50) {
    score += 10;
  }
  if (uniqueAssets === 0) score = 0;
  const circumference = 175.929;
  const strokeDashoffset = circumference - (score / 100) * circumference;

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
    <div className="portfolio-root animate-entrance">
      {/* Breadcrumb Navigation & Page Header */}
      <div className="flex flex-col gap-2 mb-8 pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-2 text-xs font-label-caps text-on-surface-variant mb-1">
          <Link to="/portfolios" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            <span>Portfolios</span>
          </Link>
          <span>/</span>
          <span className="text-on-surface">{portfolio.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-headline-sm text-2xl font-bold tracking-tight text-on-surface">{portfolio.name}</h1>
            <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant mt-1">
              Granular live performance metrics and historic transaction records.
            </p>
          </div>
          <button
            className="bg-primary text-on-primary py-2.5 px-6 font-label-caps text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all rounded"
            onClick={() => setShowAddHoldingModal(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Holding</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* 1. Top Summary Ribbon */}
      <section className="stagger-load flex flex-wrap items-center gap-4 mb-8" style={{ animationDelay: "0.1s" }}>
        <div className="flex-1 min-w-[200px] bg-surface-variant/20 p-5 rounded border border-outline-variant/10 hover:border-primary/30 transition-all group">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Total Portfolio Value</p>
          <h2 className="font-data-lg text-xl text-primary tracking-tight port-text-mono">
            ${totalMarketVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="flex-1 min-w-[200px] bg-surface-variant/20 p-5 rounded border border-outline-variant/10">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Total Invested</p>
          <h2 className="font-data-lg text-xl text-on-surface tracking-tight port-text-mono">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="flex-1 min-w-[200px] bg-surface-variant/20 p-5 rounded border border-outline-variant/10">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Unrealized P&L</p>
          <div className="flex items-center gap-2">
            <h2 className={`font-data-lg text-xl tracking-tight port-text-mono ${totalGainLoss >= 0 ? "text-[#34d399]" : "text-error"}`}>
              {totalGainLoss >= 0 ? "" : "-"}${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <span className={`flex items-center text-[11px] font-data-md px-1.5 py-0.5 rounded ${totalGainLoss >= 0 ? "bg-[#34d399]/10 text-[#34d399]" : "bg-error/10 text-error"}`}>
              <span className="material-symbols-outlined text-[12px]">{totalGainLoss >= 0 ? "arrow_upward" : "arrow_downward"}</span>
              {totalGainLossPercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="w-48 min-w-[120px] bg-surface-variant/20 p-5 rounded border border-outline-variant/10">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Holdings</p>
          <h2 className="font-data-lg text-xl text-on-surface tracking-tight">{portfolio.holdings.length}</h2>
        </div>
      </section>

      {/* Advanced Toolbar */}
      <section className="mb-6">
        <div className="stagger-load flex flex-wrap items-center justify-between gap-4 mb-4" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                className="bg-surface-variant/20 border border-outline-variant/20 focus:ring-1 focus:ring-primary/30 text-on-surface py-2 pl-9 pr-4 font-body-md text-xs rounded w-72 outline-none"
                placeholder="Search Symbol or Name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-surface-variant/20 border border-outline-variant/20 rounded divide-x divide-outline-variant/20">
              <div className="toolbar-select-wrap">
                <select
                  className="toolbar-select"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                >
                  <option value="Sector: All" style={{ backgroundColor: "#201f1f" }}>Sector: All</option>
                  {sectors
                    .filter((s) => s !== "Sector: All")
                    .map((sector) => (
                      <option key={sector} value={sector} style={{ backgroundColor: "#201f1f" }}>
                        {sector}
                      </option>
                    ))}
                </select>
              </div>
              <div className="toolbar-select-wrap">
                <select
                  className="toolbar-select"
                  value={selectedPL}
                  onChange={(e) => setSelectedPL(e.target.value)}
                >
                  <option value="P/L: All" style={{ backgroundColor: "#201f1f" }}>P/L: All</option>
                  <option value="Profitable" style={{ backgroundColor: "#201f1f" }}>Profitable</option>
                  <option value="Losing" style={{ backgroundColor: "#201f1f" }}>Losing</option>
                </select>
              </div>
              <div className="toolbar-select-wrap">
                <select
                  className="toolbar-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Sort: Value" style={{ backgroundColor: "#201f1f" }}>Sort: Value</option>
                  <option value="Symbol" style={{ backgroundColor: "#201f1f" }}>Symbol</option>
                  <option value="Change %" style={{ backgroundColor: "#201f1f" }}>Change %</option>
                  <option value="P/L Amount" style={{ backgroundColor: "#201f1f" }}>P/L Amount</option>
                </select>
              </div>
            </div>
          </div>
          <button
            className="text-on-surface-variant hover:text-primary transition-all p-2 rounded hover:bg-surface-variant/30 flex items-center gap-2"
            onClick={fetchDetail}
            aria-label="Refresh data"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </section>

      {/* Holdings & Performance Table */}
      <section className="mb-10">
        {portfolio.holdings.length === 0 ? (
          <EmptyState
            icon={<Layers size={24} />}
            title="No Positions Tracked"
            message="You haven't added any stocks to this portfolio. Tap '+ Add Holding' to record your initial assets."
            action={
              <button
                className="bg-primary text-on-primary py-2 px-4 font-label-caps text-xs font-bold flex items-center gap-2 rounded hover:opacity-90 active:scale-95 transition-all"
                onClick={() => setShowAddHoldingModal(true)}
              >
                <Plus size={14} /> Add First Position
              </button>
            }
          />
        ) : (
          <div className="stagger-load bg-surface-variant/10 rounded border border-outline-variant/10 overflow-hidden" style={{ animationDelay: "0.3s" }}>
            <div className="overflow-x-auto port-custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/20">
                    <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 uppercase tracking-widest sticky-header">
                      Company
                    </th>
                    <th className="px-4 py-4 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                      Position
                    </th>
                    <th className="px-4 py-4 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                      Price
                    </th>
                    <th className="px-4 py-4 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                      Today's Change
                    </th>
                    <th className="px-4 py-4 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                      Market Value
                    </th>
                    <th className="px-6 py-4 border-b border-outline-variant/10 text-right font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {sortedHoldings.map((h) => {
                    const meta = STOCK_METADATA[h.symbol] || { name: h.symbol, sector: "Other", logoUrl: "" };
                    const livePrice =
                      valData?.holdings.find((vh) => vh.symbol === h.symbol)?.currentPrice ||
                      Number(h.averagePrice);
                    const mktVal = h.quantity * livePrice;
                    const cost = h.quantity * Number(h.averagePrice);
                    const pnl = mktVal - cost;
                    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                    const weight = totalMarketVal > 0 ? (mktVal / totalMarketVal) * 100 : 0;

                    const priceDirection = priceDirections[h.symbol];
                    const flashClass =
                      priceDirection === "up"
                        ? "price-flash-green"
                        : priceDirection === "down"
                        ? "price-flash-red"
                        : "";

                    return (
                      <tr key={h.id} className="group hover:bg-surface-variant/20 transition-colors cursor-pointer">
                        <td className="px-6 py-5 sticky-col">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-outline-variant/20 flex items-center justify-center p-1 shrink-0">
                              {meta.logoUrl ? (
                                <img alt={h.symbol} className="w-full h-full object-contain" src={meta.logoUrl} />
                              ) : (
                                <span className="font-bold text-[10px] text-primary">{h.symbol.slice(0, 3)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-body-md font-semibold text-on-surface text-sm">{meta.name}</p>
                              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{h.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <p className="font-data-md text-on-surface text-sm port-text-mono">{h.quantity.toLocaleString()}</p>
                          <p className="text-[10px] text-on-surface-variant port-text-mono">Avg: ${Number(h.averagePrice).toFixed(2)}</p>
                        </td>
                        <td className={`px-4 py-5 text-right font-data-md text-on-surface text-sm port-text-mono ${flashClass}`}>
                          ${livePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-5 text-right">
                          <p className={`font-data-md text-sm port-text-mono ${pnl >= 0 ? "text-[#34d399]" : "text-error"}`}>
                            {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                          </p>
                          <p className={`text-[10px] port-text-mono ${pnl >= 0 ? "text-[#34d399]" : "text-error"}`}>
                            {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <p className="font-data-md text-on-surface text-sm port-text-mono">
                            ${mktVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-primary font-semibold">{weight.toFixed(1)}% Weight</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="btn-secondary-ghost text-[10px] py-1 px-3"
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
                              className="text-on-surface-variant hover:text-error transition-all p-2 rounded hover:bg-surface-variant/30"
                              onClick={() => setHoldingToDelete({ id: h.id, symbol: h.symbol })}
                              aria-label={`Delete holding ${h.symbol}`}
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
      </section>

      {/* 3. Insights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {/* Largest Position Card */}
        <div className="stagger-load port-card flex flex-col justify-between" style={{ animationDelay: "0.4s" }}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Largest Exposure</h3>
              <span className="material-symbols-outlined text-primary text-sm font-light">analytics</span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <p className="font-body-md text-on-surface font-semibold">{largestHoldingSymbol}</p>
                <span className="font-data-md text-primary">{largestWeight.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-surface-variant/40 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${largestWeight}%` }}></div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">Rebalancing alert threshold at 25% exposure.</p>
        </div>

        {/* Daily Leaders Card */}
        <div className="stagger-load port-card" style={{ animationDelay: "0.5s" }}>
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest mb-6">Daily Leaders</h3>
          <div className="space-y-4">
            {topGainer && (
              <div className="flex items-center justify-between group p-2 -m-2 rounded transition-colors hover:bg-surface-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#34d399]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#34d399] text-sm">trending_up</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold text-on-surface text-xs">{topGainer.symbol}</p>
                    <p className="text-[9px] text-on-surface-variant uppercase truncate max-w-[80px]">{topGainer.name}</p>
                  </div>
                </div>
                <span className="font-data-md text-[#34d399] text-xs port-text-mono">+{topGainer.pnlPct.toFixed(2)}%</span>
              </div>
            )}
            {worstLoser && (
              <div className="flex items-center justify-between group p-2 -m-2 rounded transition-colors hover:bg-surface-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-error/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-error text-sm">trending_down</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold text-on-surface text-xs">{worstLoser.symbol}</p>
                    <p className="text-[9px] text-on-surface-variant uppercase truncate max-w-[80px]">{worstLoser.name}</p>
                  </div>
                </div>
                <span className={`font-data-md text-xs port-text-mono ${worstLoser.pnlPct >= 0 ? "text-[#34d399]" : "text-error"}`}>
                  {worstLoser.pnlPct >= 0 ? "+" : ""}{worstLoser.pnlPct.toFixed(2)}%
                </span>
              </div>
            )}
            {!topGainer && <p className="text-xs text-on-surface-variant">No leaders data available</p>}
          </div>
        </div>

        {/* Sector Allocation Visualization */}
        <div className="stagger-load port-card" style={{ animationDelay: "0.6s" }}>
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest mb-6">Sector Weighting</h3>
          <div className="space-y-4">
            {sectorWeights.slice(0, 2).map((item, idx) => (
              <div key={item.sector}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-on-surface font-semibold">{item.sector}</span>
                  <span className="text-on-surface-variant font-data-md port-text-mono">{item.weight.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-variant/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${idx === 0 ? "bg-primary" : "bg-secondary"}`}
                    style={{ width: `${item.weight}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {sectorWeights.length === 0 && <p className="text-xs text-on-surface-variant">No sectors defined</p>}
          </div>
        </div>

        {/* Diversification Score / Risk Profile */}
        <div className="stagger-load port-card flex items-center justify-center" style={{ animationDelay: "0.7s" }}>
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest mb-2">Risk Profile</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="risk-circle-bg" cx="32" cy="32" fill="transparent" r="28" strokeWidth="3"></circle>
                  <circle
                    className="risk-circle-fg transition-all duration-700"
                    cx="32"
                    cy="32"
                    fill="transparent"
                    r="28"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeWidth="3"
                  ></circle>
                </svg>
                <span className="absolute font-data-md text-on-surface text-sm port-text-mono">{score}</span>
              </div>
              <div>
                <p className="font-body-md text-on-surface text-xs font-semibold">{score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Concentrated"}</p>
                <p className="text-[9px] text-on-surface-variant">Diversification</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Allocation breakdown chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="port-card mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-semibold">
                Assets Allocation (Cost vs Market Value)
              </h2>
            </div>
          </div>
          <div style={{ width: "100%", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--port-primary)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--port-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--port-emerald)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--port-emerald)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  contentStyle={{
                    background: "var(--port-surface)",
                    border: "1px solid var(--port-outline-variant)",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--port-on-surface)",
                  }}
                />
                <Area type="monotone" dataKey="cost" stroke="var(--port-primary)" strokeWidth={1} fillOpacity={1} fill="url(#colorCost)" name="Cost Basis" />
                <Area type="monotone" dataKey="market" stroke="var(--port-emerald)" strokeWidth={1} fillOpacity={1} fill="url(#colorMarket)" name="Market Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Transaction History Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="port-card mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary" />
            <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-semibold">Transaction History</h2>
          </div>
        </div>

        {allTransactions.length === 0 ? (
          <EmptyState icon={<History size={24} />} title="No Logs Available" message="No transaction history logged for this portfolio." />
        ) : (
          <div className="overflow-x-auto port-custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/20">
                  <th className="px-6 py-3 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-4 py-3 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 uppercase tracking-widest">
                    Symbol
                  </th>
                  <th className="px-4 py-3 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 uppercase tracking-widest">
                    Type
                  </th>
                  <th className="px-4 py-3 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                    Quantity
                  </th>
                  <th className="px-4 py-3 font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant/10 text-right uppercase tracking-widest">
                    Price
                  </th>
                  <th className="px-6 py-3 border-b border-outline-variant/10 text-right font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Net Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {allTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-6 py-4 text-on-surface-variant text-xs port-text-mono">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-on-surface text-sm font-semibold">{tx.symbol}</td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-label-caps px-2 py-0.5 rounded ${tx.type === "BUY" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-error/10 text-error"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right port-text-mono text-xs">{tx.quantity.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right port-text-mono text-xs">${Number(tx.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right port-text-mono text-sm font-semibold">
                      ${(tx.quantity * Number(tx.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="form-group mb-4">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="symbol">
                  Stock Symbol (Ticker)
                </label>
                <input
                  id="symbol"
                  type="text"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={holdingSymbol}
                  onChange={(e) => setHoldingSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, NVDA, TSLA"
                  required
                  maxLength={10}
                  autoFocus
                />
              </div>
              <div className="form-group mb-4">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="quantity">
                  Share Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  step="any"
                  min="0.0001"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={holdingQty}
                  onChange={(e) => setHoldingQty(e.target.value)}
                  placeholder="e.g. 10.0"
                  required
                />
              </div>
              <div className="form-group mb-6">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="averagePrice">
                  Average Executed Price ($)
                </label>
                <input
                  id="averagePrice"
                  type="number"
                  step="any"
                  min="0.01"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={holdingAvgPrice}
                  onChange={(e) => setHoldingAvgPrice(e.target.value)}
                  placeholder="e.g. 172.50"
                  required
                />
              </div>
              <div className="modal-actions flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-ghost"
                  onClick={() => setShowAddHoldingModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-primary py-2.5 px-5 font-label-caps text-xs font-bold rounded hover:opacity-90 active:scale-95 transition-all"
                  disabled={submitting}
                >
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
              <div className="form-group mb-4">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block">Execution Order Type</label>
                <div className="radio-group flex gap-4">
                  <label className={`flex-1 flex items-center justify-center border rounded py-3 px-4 cursor-pointer text-xs font-label-caps select-none transition-all ${txType === "BUY" ? "bg-[#34d399]/10 border-[#34d399] text-[#34d399]" : "border-outline-variant/20 text-on-surface-variant hover:text-on-surface"}`}>
                    <input
                      type="radio"
                      name="txType"
                      value="BUY"
                      className="hidden"
                      checked={txType === "BUY"}
                      onChange={() => setTxType("BUY")}
                    />
                    <span>BUY ORDER</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center border rounded py-3 px-4 cursor-pointer text-xs font-label-caps select-none transition-all ${txType === "SELL" ? "bg-error/10 border-error text-error" : "border-outline-variant/20 text-on-surface-variant hover:text-on-surface"}`}>
                    <input
                      type="radio"
                      name="txType"
                      value="SELL"
                      className="hidden"
                      checked={txType === "SELL"}
                      onChange={() => setTxType("SELL")}
                    />
                    <span>SELL ORDER</span>
                  </label>
                </div>
              </div>
              <div className="form-group mb-4" style={{ marginTop: "1rem" }}>
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="txQuantity">
                  Order Quantity
                </label>
                <input
                  id="txQuantity"
                  type="number"
                  step="any"
                  min="0.0001"
                  max={txType === "SELL" ? selectedHoldingForTx.quantity : undefined}
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  placeholder={`Max Sell limit: ${selectedHoldingForTx.quantity}`}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group mb-6">
                <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider mb-2 block" htmlFor="txPrice">
                  Order Price per Unit ($)
                </label>
                <input
                  id="txPrice"
                  type="number"
                  step="any"
                  min="0.01"
                  className="w-full bg-surface-variant/20 border-b border-outline-variant/35 focus:border-primary text-on-surface py-2.5 px-3 font-body-md text-sm outline-none transition-colors rounded-sm"
                  value={txPrice}
                  onChange={(e) => setTxPrice(e.target.value)}
                  placeholder="Market price"
                  required
                />
              </div>
              <div className="modal-actions flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-ghost"
                  onClick={() => setSelectedHoldingForTx(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-primary py-2.5 px-5 font-label-caps text-xs font-bold rounded hover:opacity-90 active:scale-95 transition-all"
                  disabled={submitting}
                >
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

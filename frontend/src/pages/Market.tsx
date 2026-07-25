import { useState, FormEvent } from "react";
import api from "../services/api";
import type { StockQuote } from "../types";
import ErrorBanner from "../components/ErrorBanner";
import StatCard from "../components/StatCard";

export default function Market() {
  const [symbolInput, setSymbolInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;

    setLoading(true);
    setError(null);
    setQuote(null);

    const formattedSymbol = symbolInput.trim().toUpperCase();

    try {
      const res = await api.get<StockQuote>(`/api/market/price/${formattedSymbol}`);
      setQuote(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch quote for ${formattedSymbol}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Lookup</h1>
          <p className="text-muted">Search real-time stock prices powered by Finnhub & Redis caching.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "500px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="marketSearchSymbol">Stock Ticker Symbol</label>
            <input
              id="marketSearchSymbol"
              type="text"
              className="form-input"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL, GOOGL, TSLA"
              required
              maxLength={10}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && <ErrorBanner message={error} />}

      {quote && (
        <div className="stat-grid" style={{ maxWidth: "600px", marginTop: "1rem" }}>
          <StatCard label="Symbol" value={quote.symbol} sub="Ticker identifier" />
          <StatCard
            label="Current Live Price"
            value={`$${quote.currentPrice.toFixed(2)}`}
            sub="Cached 60s TTL"
            valueClass="text-green"
          />
        </div>
      )}
    </div>
  );
}

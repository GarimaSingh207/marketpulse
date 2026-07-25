// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  holdingId: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  createdAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  transactions: Transaction[];
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  holdings: Holding[];
}

// ─── Portfolio Value ──────────────────────────────────────────────────────────

export interface HoldingValue {
  symbol: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
}

export interface PortfolioValue {
  portfolioId: string;
  totalValue: number;
  holdings: HoldingValue[];
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export interface WatchlistStock {
  id: string;
  watchlistId: string;
  symbol: string;
  currentPrice?: number | null;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  stocks: WatchlistStock[];
}

// ─── Market ───────────────────────────────────────────────────────────────────

export interface StockQuote {
  symbol: string;
  currentPrice: number;
}

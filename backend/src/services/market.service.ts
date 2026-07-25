import axios from "axios";
import redis from "../lib/redis";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
}

const CACHE_TTL_SECONDS = 60;

/**
 * Fetches a real-time stock price.
 *
 * Cache flow:
 *   1. Check Redis for key `stock:<SYMBOL>`
 *   2. If hit  → return cached value immediately
 *   3. If miss → fetch from Finnhub, cache for 60 s, return value
 */
export const fetchStockPrice = async (symbol: string): Promise<StockQuote> => {
  const formattedSymbol = symbol.trim().toUpperCase();

  // Validate ticker format (1-10 alphanumeric characters and dots)
  if (!/^[A-Z0-9.]{1,10}$/.test(formattedSymbol)) {
    throw { status: 400, message: "Invalid ticker symbol format" };
  }

  const cacheKey = `stock:${formattedSymbol}`;

  // --- Redis cache check ---
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`CACHE HIT: ${cacheKey}`);
      return JSON.parse(cached) as StockQuote;
    }
    console.log(`CACHE MISS: ${cacheKey}`);
  } catch {
    // Redis is down or unavailable — fall through to live fetch
  }

  const apiKey = process.env.MARKET_API_KEY;
  if (!apiKey) {
    throw {
      status: 503,
      message: "Market data provider is currently unavailable (API key not configured)",
    };
  }

  try {
    const response = await axios.get("https://finnhub.io/api/v1/quote", {
      params: {
        symbol: formattedSymbol,
        token: apiKey,
      },
      timeout: 5000,
    });

    const data = response.data;

    // Finnhub returns c == 0 or empty object for invalid/unknown ticker symbols
    if (!data || data.c === undefined || data.c === 0) {
      throw { status: 400, message: `Invalid or unknown stock symbol: ${formattedSymbol}` };
    }

    const quote: StockQuote = {
      symbol: formattedSymbol,
      currentPrice: Number(data.c),
    };

    // --- Store in Redis for 60 seconds ---
    try {
      await redis.set(cacheKey, JSON.stringify(quote), "EX", CACHE_TTL_SECONDS);
    } catch {
      // Redis write failed — not fatal, continue without caching
    }

    return quote;
  } catch (error: any) {
    if (error.status && error.message) {
      throw error;
    }

    if (error.response) {
      if (error.response.status === 401) {
        throw { status: 503, message: "Market data provider authentication failed (Invalid API key)" };
      }
      if (error.response.status === 429) {
        throw { status: 503, message: "Market data rate limit exceeded. Please try again later." };
      }
      if (error.response.status >= 500) {
        throw { status: 503, message: "Market data provider is currently unavailable" };
      }
    }

    if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
      throw { status: 503, message: "Market data service unreachable or timed out" };
    }

    throw { status: 503, message: "Failed to fetch market data" };
  }
};

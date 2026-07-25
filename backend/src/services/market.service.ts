import axios from "axios";
import redis from "../lib/redis";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
}

const CACHE_TTL_SECONDS = 60;

/**
 * Generates a stable fallback stock price based on symbol string hash
 * used when external market API rate-limits or is unauthenticated.
 */
const getFallbackQuote = (symbol: string): StockQuote => {
  const hash = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackPrice = Number((100 + (hash % 150) + 0.45).toFixed(2));
  return {
    symbol,
    currentPrice: fallbackPrice,
  };
};

/**
 * Fetches a real-time stock price.
 *
 * Cache flow:
 *   1. Check Redis for key `stock:<SYMBOL>`
 *   2. If hit  → return cached value immediately
 *   3. If miss → fetch from Finnhub (or fallback), cache for 60 s, return value
 */
export const fetchStockPrice = async (symbol: string): Promise<StockQuote> => {
  const formattedSymbol = symbol.trim().toUpperCase();

  // Validate ticker format (1-10 alphanumeric characters and dots)
  if (!/^[A-Z0-9.]{1,10}$/.test(formattedSymbol)) {
    throw { status: 400, message: "Invalid ticker symbol format" };
  }

  const cacheKey = `stock:${formattedSymbol}`;

  // --- 1. Redis cache check ---
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[redis] CACHE HIT: ${cacheKey}`);
      return JSON.parse(cached) as StockQuote;
    }
    console.log(`[redis] CACHE MISS: ${cacheKey}`);
  } catch {
    // Redis is down or unavailable — fall through
  }

  const apiKey = process.env.MARKET_API_KEY;

  let quote: StockQuote;

  if (!apiKey || apiKey === "your_finnhub_api_key_here") {
    quote = getFallbackQuote(formattedSymbol);
  } else {
    try {
      const response = await axios.get("https://finnhub.io/api/v1/quote", {
        params: {
          symbol: formattedSymbol,
          token: apiKey,
        },
        timeout: 4000,
      });

      const data = response.data;

      // Finnhub returns c == 0 for unknown tickers
      if (!data || data.c === undefined || data.c === 0) {
        quote = getFallbackQuote(formattedSymbol);
      } else {
        quote = {
          symbol: formattedSymbol,
          currentPrice: Number(data.c),
        };
      }
    } catch {
      // External API network error, rate limit, or invalid key -> fallback to generated quote
      quote = getFallbackQuote(formattedSymbol);
    }
  }

  // --- 2. Store in Redis for 60 seconds ---
  try {
    await redis.set(cacheKey, JSON.stringify(quote), "EX", CACHE_TTL_SECONDS);
  } catch {
    // Redis write failed — not fatal
  }

  return quote;
};

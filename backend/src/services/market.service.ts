import axios from "axios";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
}

/**
 * Fetches real-time stock price quote using the Finnhub API.
 */
export const fetchStockPrice = async (symbol: string): Promise<StockQuote> => {
  const formattedSymbol = symbol.trim().toUpperCase();

  // Validate ticker format (1-10 alphanumeric characters and dots)
  if (!/^[A-Z0-9.]{1,10}$/.test(formattedSymbol)) {
    throw { status: 400, message: "Invalid ticker symbol format" };
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

    return {
      symbol: formattedSymbol,
      currentPrice: Number(data.c),
    };
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

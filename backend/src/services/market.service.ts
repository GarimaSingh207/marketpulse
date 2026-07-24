import axios from "axios";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
}

export const fetchStockPrice = async (symbol: string): Promise<StockQuote> => {
  const formattedSymbol = symbol.trim().toUpperCase();

  // Validate ticker format (1-10 alphanumeric characters and dots)
  if (!/^[A-Z0-9.]{1,10}$/.test(formattedSymbol)) {
    throw { status: 400, message: "Invalid ticker symbol format" };
  }

  const apiKey = process.env.MARKET_API_KEY;

  // Primary Provider: Finnhub API (if configured and valid)
  if (apiKey && apiKey !== "your_finnhub_api_key_here") {
    try {
      const response = await axios.get("https://finnhub.io/api/v1/quote", {
        params: {
          symbol: formattedSymbol,
          token: apiKey,
        },
        timeout: 4000,
      });

      const data = response.data;
      if (data && data.c && data.c !== 0) {
        return {
          symbol: formattedSymbol,
          currentPrice: Number(data.c),
        };
      }
    } catch (err: any) {
      if (err.response && err.response.status === 429) {
        throw { status: 503, message: "Market data rate limit exceeded. Please try again later." };
      }
    }
  }

  // Fallback Provider: Yahoo Finance public API endpoint (No API key needed)
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 5000,
    });

    const result = response.data?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;

    if (price === undefined || price === null || isNaN(price)) {
      throw { status: 400, message: `Invalid or unknown stock symbol: ${formattedSymbol}` };
    }

    return {
      symbol: formattedSymbol,
      currentPrice: Number(price),
    };
  } catch (error: any) {
    if (error.status && error.message) {
      throw error;
    }

    if (error.response) {
      if (error.response.status === 404 || error.response.status === 400) {
        throw { status: 400, message: `Invalid or unknown stock symbol: ${formattedSymbol}` };
      }
      if (error.response.status === 429) {
        throw { status: 503, message: "Market data rate limit exceeded. Please try again later." };
      }
    }

    if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
      throw { status: 503, message: "Market data service unreachable or timed out" };
    }

    throw { status: 503, message: "Market data provider is currently unavailable" };
  }
};

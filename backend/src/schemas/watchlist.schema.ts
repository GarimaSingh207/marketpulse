import { z } from "zod";

export const createWatchlistSchema = z.object({
  name: z.string().min(1, "Watchlist name is required").trim(),
});

export const addWatchlistStockSchema = z.object({
  symbol: z
    .string()
    .min(1, "Stock symbol is required")
    .max(10, "Symbol must be 10 characters or fewer")
    .trim()
    .transform((val) => val.toUpperCase()),
});

import { z } from "zod";

export const createPortfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required"),
});

export const createHoldingSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").transform((val) => val.toUpperCase()),
  quantity: z.number().positive("Quantity must be greater than 0"),
  averagePrice: z.number().positive("Average price must be greater than 0"),
});

export const createTransactionSchema = z.object({
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().positive("Price must be greater than 0"),
});

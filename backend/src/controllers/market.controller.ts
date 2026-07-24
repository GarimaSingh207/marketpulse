import { Request, Response } from "express";
import { fetchStockPrice } from "../services/market.service";

export const getMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSymbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;

    if (!rawSymbol) {
      res.status(400).json({ message: "Stock symbol parameter is required" });
      return;
    }

    const quote = await fetchStockPrice(rawSymbol);
    res.status(200).json(quote);
  } catch (error: any) {
    const statusCode = error.status || 503;
    const message = error.message || "Failed to fetch market price";
    res.status(statusCode).json({ message });
  }
};

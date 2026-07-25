import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createWatchlistSchema, addWatchlistStockSchema } from "../schemas/watchlist.schema";
import { fetchStockPrice } from "../services/market.service";
import { emitUserEvent } from "../socket";

// ─── POST /api/watchlists ───────────────────────────────────────────────────
export const createWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createWatchlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    const { name } = parseResult.data;
    const userId = req.user!.id;

    const watchlist = await prisma.watchlist.create({
      data: { name, userId },
      include: { stocks: true },
    });

    emitUserEvent(userId, "watchlist:created", {
      watchlistId: watchlist.id,
      name: watchlist.name,
    });

    res.status(201).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/watchlists ────────────────────────────────────────────────────
export const getWatchlists = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
      include: { stocks: true },
    });

    res.status(200).json(watchlists);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/watchlists/:id ────────────────────────────────────────────────
// Returns the watchlist with all stocks and their live prices.
export const getWatchlistById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({ message: "Watchlist ID is required" });
      return;
    }

    const watchlist = await prisma.watchlist.findFirst({
      where: { id, userId },
      include: { stocks: true },
    });

    if (!watchlist) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }

    // Fetch live prices for each symbol using the market service (Redis-cached)
    const stocksWithPrices = await Promise.all(
      watchlist.stocks.map(async (stock) => {
        let currentPrice: number | null = null;
        try {
          const quote = await fetchStockPrice(stock.symbol);
          currentPrice = quote.currentPrice;
        } catch {
          // If live price is unavailable, return null — client handles display
        }
        return {
          id: stock.id,
          symbol: stock.symbol,
          currentPrice,
        };
      })
    );

    res.status(200).json({
      id: watchlist.id,
      name: watchlist.name,
      userId: watchlist.userId,
      stocks: stocksWithPrices,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── DELETE /api/watchlists/:id ─────────────────────────────────────────────
export const deleteWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({ message: "Watchlist ID is required" });
      return;
    }

    const watchlist = await prisma.watchlist.findFirst({ where: { id, userId } });

    if (!watchlist) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }

    await prisma.watchlist.delete({ where: { id } });

    emitUserEvent(userId, "watchlist:deleted", { watchlistId: id });

    res.status(200).json({ message: "Watchlist deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── POST /api/watchlists/:id/stocks ────────────────────────────────────────
export const addStockToWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({ message: "Watchlist ID is required" });
      return;
    }

    const watchlist = await prisma.watchlist.findFirst({ where: { id, userId } });

    if (!watchlist) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }

    const parseResult = addWatchlistStockSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    const { symbol } = parseResult.data;

    // Prevent duplicate symbols inside the same watchlist
    const existing = await prisma.watchlistStock.findFirst({
      where: { watchlistId: id, symbol },
    });

    if (existing) {
      res.status(409).json({ message: `${symbol} is already in this watchlist` });
      return;
    }

    const stock = await prisma.watchlistStock.create({
      data: { watchlistId: id, symbol },
    });

    emitUserEvent(userId, "watchlist:stockAdded", {
      watchlistId: id,
      stockId: stock.id,
      symbol: stock.symbol,
    });

    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── DELETE /api/watchlists/:id/stocks/:symbol ──────────────────────────────
export const removeStockFromWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rawSymbol = Array.isArray(req.params.symbol)
      ? req.params.symbol[0]
      : req.params.symbol;
    const userId = req.user!.id;

    if (!id || !rawSymbol) {
      res.status(400).json({ message: "Watchlist ID and symbol are required" });
      return;
    }

    const symbol = rawSymbol.trim().toUpperCase();

    const watchlist = await prisma.watchlist.findFirst({ where: { id, userId } });

    if (!watchlist) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }

    const stock = await prisma.watchlistStock.findFirst({
      where: { watchlistId: id, symbol },
    });

    if (!stock) {
      res.status(404).json({ message: `${symbol} not found in this watchlist` });
      return;
    }

    await prisma.watchlistStock.delete({ where: { id: stock.id } });

    emitUserEvent(userId, "watchlist:stockRemoved", {
      watchlistId: id,
      symbol,
    });

    res.status(200).json({ message: `${symbol} removed from watchlist` });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

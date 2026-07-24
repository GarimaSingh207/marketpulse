import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { fetchStockPrice } from "../services/market.service";

export const getPortfolioValue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const portfolioId = Array.isArray(req.params.portfolioId)
      ? req.params.portfolioId[0]
      : req.params.portfolioId;
    const userId = req.user!.id;

    if (!portfolioId) {
      res.status(400).json({ message: "Portfolio ID is required" });
      return;
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      res.status(404).json({ message: "Portfolio not found" });
      return;
    }

    let totalValue = 0;
    const holdingsValueList = [];

    for (const holding of portfolio.holdings) {
      let currentPrice = 0;
      try {
        const quote = await fetchStockPrice(holding.symbol);
        currentPrice = quote.currentPrice;
      } catch (err) {
        // Fallback to average price if live market data is unreachable for a symbol
        currentPrice = Number(holding.averagePrice);
      }

      const marketValue = Number((holding.quantity * currentPrice).toFixed(2));
      totalValue += marketValue;

      holdingsValueList.push({
        symbol: holding.symbol,
        quantity: holding.quantity,
        currentPrice,
        marketValue,
      });
    }

    res.status(200).json({
      portfolioId: portfolio.id,
      totalValue: Number(totalValue.toFixed(2)),
      holdings: holdingsValueList,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

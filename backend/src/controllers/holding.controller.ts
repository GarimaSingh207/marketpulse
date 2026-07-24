import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createHoldingSchema } from "../schemas/portfolio.schema";

export const addHolding = async (req: AuthRequest, res: Response): Promise<void> => {
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
    });

    if (!portfolio) {
      res.status(404).json({ message: "Portfolio not found" });
      return;
    }

    const parseResult = createHoldingSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    const { symbol, quantity, averagePrice } = parseResult.data;

    const holding = await prisma.holding.create({
      data: {
        portfolioId,
        symbol,
        quantity,
        averagePrice,
      },
    });

    res.status(201).json(holding);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteHolding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({ message: "Holding ID is required" });
      return;
    }

    const holding = await prisma.holding.findFirst({
      where: { id },
      include: {
        portfolio: true,
      },
    });

    if (!holding || holding.portfolio.userId !== userId) {
      res.status(404).json({ message: "Holding not found" });
      return;
    }

    await prisma.holding.delete({
      where: { id },
    });

    res.status(200).json({ message: "Holding deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

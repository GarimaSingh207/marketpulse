import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createPortfolioSchema } from "../schemas/portfolio.schema";

export const createPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createPortfolioSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    const { name } = parseResult.data;
    const userId = req.user!.id;

    const portfolio = await prisma.portfolio.create({
      data: {
        name,
        userId,
      },
      include: {
        holdings: true,
      },
    });

    res.status(201).json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPortfolios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: {
            transactions: true,
          },
        },
      },
    });

    res.status(200).json(portfolios);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({ message: "Portfolio ID is required" });
      return;
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!portfolio) {
      res.status(404).json({ message: "Portfolio not found" });
      return;
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    res.status(200).json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

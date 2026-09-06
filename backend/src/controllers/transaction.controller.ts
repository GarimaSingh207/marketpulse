import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createTransactionSchema } from "../schemas/portfolio.schema";
import { emitUserEvent } from "../socket";

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const holdingId = Array.isArray(req.params.holdingId)
      ? req.params.holdingId[0]
      : req.params.holdingId;
    const userId = req.user!.id;

    if (!holdingId) {
      res.status(400).json({ message: "Holding ID is required" });
      return;
    }

    const holding = await prisma.holding.findFirst({
      where: { id: holdingId },
      include: { portfolio: true },
    });

    if (!holding || holding.portfolio.userId !== userId) {
      res.status(404).json({ message: "Holding not found" });
      return;
    }

    const parseResult = createTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    const { type, quantity, price } = parseResult.data;

    let updatedQuantity: Prisma.Decimal;
    let updatedAveragePrice: Prisma.Decimal;

    const currentQuantity = new Prisma.Decimal(holding.quantity);
    const currentAvgPrice = new Prisma.Decimal(holding.averagePrice);
    const txQuantity = new Prisma.Decimal(quantity);
    const txPrice = new Prisma.Decimal(price);

    if (type === "BUY") {
      updatedQuantity = currentQuantity.plus(txQuantity);
      const totalCost = currentQuantity.times(currentAvgPrice).plus(txQuantity.times(txPrice));
      updatedAveragePrice = totalCost.div(updatedQuantity);
    } else {
      // SELL logic
      if (txQuantity.greaterThan(currentQuantity)) {
        res.status(400).json({
          message: `Cannot sell ${quantity} units. Only ${currentQuantity.toString()} available.`,
        });
        return;
      }
      updatedQuantity = currentQuantity.minus(txQuantity);
      // Selling does not change the weighted average cost basis of remaining shares
      updatedAveragePrice = currentAvgPrice;
    }

    // Execute transaction creation and holding update atomically
    const [transaction, updatedHolding] = await prisma.$transaction([
      prisma.transaction.create({
        data: { holdingId, type, quantity: txQuantity, price: txPrice },
      }),
      prisma.holding.update({
        where: { id: holdingId },
        data: { quantity: updatedQuantity, averagePrice: updatedAveragePrice },
      }),
    ]);

    emitUserEvent(userId, "transaction:created", {
      transactionId: transaction.id,
      holdingId: transaction.holdingId,
      portfolioId: holding.portfolioId,
      type: transaction.type,
      quantity: Number(transaction.quantity),
      price: Number(transaction.price),
      createdAt: transaction.createdAt,
    });

    emitUserEvent(userId, "portfolio:valueUpdated", {
      portfolioId: holding.portfolioId,
      updatedHolding: {
        holdingId: updatedHolding.id,
        quantity: Number(updatedHolding.quantity),
        averagePrice: Number(updatedHolding.averagePrice),
      },
    });

    res.status(201).json({ transaction, holding: updatedHolding });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

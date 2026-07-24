import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getDbCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      database: "disconnected",
    });
  }
};

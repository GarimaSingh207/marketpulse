import { Request, Response } from "express";

export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    message: "MarketPulse backend is running",
  });
};

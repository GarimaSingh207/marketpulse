import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication token required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Access forbidden: insufficient permissions" });
      return;
    }

    next();
  };
};

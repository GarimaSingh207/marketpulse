import { Router } from "express";
import {
  createPortfolio,
  getPortfolios,
  deletePortfolio,
} from "../controllers/portfolio.controller";
import { addHolding } from "../controllers/holding.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Protect all portfolio routes with JWT authentication
router.use(authenticateToken);

router.post("/", createPortfolio);
router.get("/", getPortfolios);
router.delete("/:id", deletePortfolio);
router.post("/:portfolioId/holdings", addHolding);

export default router;

import { Router } from "express";
import { getMarketPrice } from "../controllers/market.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Protect market data endpoint with JWT authentication
router.use(authenticateToken);

router.get("/price/:symbol", getMarketPrice);

export default router;

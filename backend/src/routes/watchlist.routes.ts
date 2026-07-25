import { Router } from "express";
import {
  createWatchlist,
  getWatchlists,
  getWatchlistById,
  deleteWatchlist,
  addStockToWatchlist,
  removeStockFromWatchlist,
} from "../controllers/watchlist.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All watchlist routes require JWT authentication
router.use(authenticateToken);

router.post("/", createWatchlist);
router.get("/", getWatchlists);
router.get("/:id", getWatchlistById);
router.delete("/:id", deleteWatchlist);
router.post("/:id/stocks", addStockToWatchlist);
router.delete("/:id/stocks/:symbol", removeStockFromWatchlist);

export default router;

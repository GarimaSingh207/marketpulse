import { Router } from "express";
import { deleteHolding } from "../controllers/holding.controller";
import { createTransaction } from "../controllers/transaction.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Protect holding routes with JWT authentication
router.use(authenticateToken);

router.delete("/:id", deleteHolding);
router.post("/:holdingId/transactions", createTransaction);

export default router;

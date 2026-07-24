import { Router } from "express";
import { getAllUsers, deleteUser } from "../controllers/admin.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;

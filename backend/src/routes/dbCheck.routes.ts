import { Router } from "express";
import { getDbCheck } from "../controllers/dbCheck.controller";

const router = Router();

router.get("/", getDbCheck);

export default router;

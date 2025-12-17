import express from "express";
import { getUserSimulations } from "../controllers/simulationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Protected route - only logged-in users can fetch their simulations
router.get("/", protect, getUserSimulations);

export default router;
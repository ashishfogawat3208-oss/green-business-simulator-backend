import express from "express";
import { runSimulation, getUserSimulations } from "../controllers/simulationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Protected routes
router.post("/", protect, runSimulation);
router.get("/history", protect, getUserSimulations);

export default router;
// backend/routes/aiRoutes.js
import express from "express";
import { getAIInsights } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧠 Phase 4: AI Insights Route
// Protected route – requires valid JWT token
router.get("/analyze", protect, getAIInsights);

export default router;
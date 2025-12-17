// backend/routes/roiRoutes.js
import express from "express";
import Simulation from "../models/simulation.js";
import { protect } from "../middleware/authMiddleware.js";

// ✅ inline forecast util (no extra service file needed)
function linearForecast(points, futureSteps = 6) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return [];
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const forecasts = [];
  const lastX = points[points.length - 1].x;
  for (let i = 1; i <= futureSteps; i++) {
    const x = lastX + i;
    const y = intercept + slope * x;
    forecasts.push({ x, y });
  }
  return forecasts;
}

const router = express.Router();

// ------------------------- ROI ANALYSIS -------------------------
router.get("/analyze", protect, async (req, res) => {
  try {
    const sims = await Simulation.find({ user: req.user._id });
    if (!sims.length) {
      return res.json({
        totalSimulations: 0,
        avgROI: 0,
        avgGreenScore: 0,
        totalInvestment: 0,
        estimatedSavings: 0,
        paybackPeriod: 0,
        monthlyProjection: [],
      });
    }

    const totalSimulations = sims.length;
    const avgROI =
      sims.reduce((sum, s) => sum + (Number(s.roi) || 0), 0) / totalSimulations;
    const avgGreenScore =
      sims.reduce((sum, s) => sum + (Number(s.greenScore) || 0), 0) /
      totalSimulations;

    const enriched = sims.map((s) => {
      const roi = Number(s.roi) || avgROI;
      const green = Number(s.greenScore) || avgGreenScore;
      const investment =
        Number(s.investment) || Math.floor(Math.random() * 80000 + 150000);
      const savings =
        Number(s.savings) || (investment * (roi / 100) * (green / 100));
      return {
        roi,
        green,
        investment,
        savings,
        date: s.createdAt || s._id.getTimestamp?.(),
      };
    });

    const totalInvestment = enriched.reduce((sum, e) => sum + e.investment, 0);
    const totalSavings = enriched.reduce((sum, e) => sum + e.savings, 0);
    const paybackPeriod = totalSavings > 0 ? totalInvestment / totalSavings : 0;

    const monthlyProjection = Array.from({ length: 12 }, (_, i) => ({
      month: `Month ${i + 1}`,
      projectedROI: Number((avgROI + Math.sin(i / 2) * 3).toFixed(2)),
    }));

    res.json({
      totalSimulations,
      avgROI: Number(avgROI.toFixed(2)),
      avgGreenScore: Number(avgGreenScore.toFixed(2)),
      totalInvestment: Math.round(totalInvestment),
      estimatedSavings: Number(totalSavings.toFixed(2)),
      paybackPeriod: Number(paybackPeriod.toFixed(1)),
      monthlyProjection,
    });
  } catch (err) {
    console.error("ROI analyze error:", err);
    res.status(500).json({ message: "Error analyzing ROI" });
  }
});

// ------------------------- FORECAST -------------------------
router.get("/forecast", protect, async (req, res) => {
  try {
    const sims = await Simulation.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    if (!sims.length) return res.json({ forecast: [] });

    const points = sims.map((s, idx) => ({ x: idx + 1, y: Number(s.roi) || 0 }));
    const forecastPoints = linearForecast(points, 12);
    const forecast = forecastPoints.map((p, i) => ({
      month: `Month ${points.length + i + 1}`,
      roi: Number(p.y.toFixed(2)),
    }));

    res.json({ forecast });
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ message: "Error generating forecast" });
  }
});

// ------------------------- CARBON ANALYTICS -------------------------
router.get("/carbon", protect, async (req, res) => {
  try {
    const EMISSION_FACTOR = 0.82; // kgCO2/kWh
    const COST_PER_KWH = 8; // ₹ per kWh
    const sims = await Simulation.find({ user: req.user._id });
    if (!sims.length) return res.json({ totalKgCO2Saved: 0 });

    const totalSavingsRs =
      sims.reduce((sum, s) => sum + (Number(s.savings) || 0), 0) ||
      sims.reduce(
        (sum, s) =>
          sum + (Number(s.investment) || 0) * ((Number(s.roi) || 0) / 100),
        0
      );

    const kwhSaved = totalSavingsRs / COST_PER_KWH;
    const kgCO2Saved = kwhSaved * EMISSION_FACTOR;

    res.json({
      totalSavingsRs: Number(totalSavingsRs.toFixed(2)),
      kwhSaved: Number(kwhSaved.toFixed(2)),
      totalKgCO2Saved: Number(kgCO2Saved.toFixed(2)),
    });
  } catch (err) {
    console.error("Carbon calc error:", err);
    res.status(500).json({ message: "Error calculating carbon analytics" });
  }
});

// ------------------------- COMPARISON -------------------------
router.get("/compare", protect, async (req, res) => {
  try {
    const sims = await Simulation.find({ user: req.user._id });
    if (!sims.length) return res.json({ groups: [] });

    const groups = {};
    sims.forEach((s) => {
      const type = s.businessType || "Unknown";
      if (!groups[type])
        groups[type] = {
          count: 0,
          roiSum: 0,
          greenSum: 0,
          investSum: 0,
          savingsSum: 0,
        };
      groups[type].count++;
      groups[type].roiSum += Number(s.roi) || 0;
      groups[type].greenSum += Number(s.greenScore) || 0;
      groups[type].investSum += Number(s.investment) || 0;
      groups[type].savingsSum += Number(s.savings) || 0;
    });

    const result = Object.entries(groups).map(([type, agg]) => ({
      businessType: type,
      count: agg.count,
      avgROI: Number((agg.roiSum / agg.count).toFixed(2)),
      avgGreenScore: Number((agg.greenSum / agg.count).toFixed(2)),
      avgInvestment: Math.round(agg.investSum / agg.count),
      avgSavings: Number((agg.savingsSum / agg.count).toFixed(2)),
    }));

    res.json({ groups: result });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ message: "Error in comparison" });
  }
});

export default router;

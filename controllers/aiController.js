// backend/controllers/aiController.js
import Simulation from "../models/simulation.js";

/**
 * AI Controller
 * Generates eco-financial insights based on stored simulation data.
 * Phase 4 – AI Intelligence Layer
 */

export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user?._id;
    const simulations = await Simulation.find({ user: userId });

    if (!simulations || simulations.length === 0) {
      return res.status(200).json({
        summary: {
          totalSimulations: 0,
          avgROI: 0,
          avgGreenScore: 0,
          avgEnergy: 0,
          roiTrend: 0,
          predictedGrowth: 0,
        },
        monthlyTrends: [],
        energyDist: { solar: 0, grid: 0, other: 0 },
        suggestions: ["No simulations yet — run a few to generate insights."],
      });
    }

    // ✅ 1. Aggregate core statistics
    const totalSimulations = simulations.length;
    const avgROI =
      simulations.reduce((sum, s) => sum + (s.roi || 0), 0) / totalSimulations;
    const avgGreenScore =
      simulations.reduce((sum, s) => sum + (s.greenScore || 0), 0) /
      totalSimulations;
    const avgEnergy =
      simulations.reduce((sum, s) => sum + (s.energy || 0), 0) /
      totalSimulations;

    // ✅ 2. Monthly ROI trend (12 months view)
    const monthlyGroups = {};
    simulations.forEach((s) => {
      const date = new Date(s.createdAt);
      const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
      const year = date.getFullYear();
      const key = `${month}-${year}`;
      if (!monthlyGroups[key]) monthlyGroups[key] = [];
      monthlyGroups[key].push(s.roi || 0);
    });

    // Fill 12-month data (current month → past 11)
    const now = new Date();
    const last12 = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" }).toUpperCase();
      const year = d.getFullYear();
      const key = `${label}-${year}`;
      const avg =
        monthlyGroups[key]?.length
          ? monthlyGroups[key].reduce((a, b) => a + b, 0) / monthlyGroups[key].length
          : 0;
      last12.push({ month: label, roi: parseFloat(avg.toFixed(1)) });
    }

    const monthlyTrends = last12;

    // ✅ 3. ROI trend delta
    let roiTrend = 0;
    if (monthlyTrends.length >= 2) {
      const last = parseFloat(monthlyTrends.at(-1).roi || 0);
      const prev = parseFloat(monthlyTrends.at(-2).roi || 0);
      roiTrend = last - prev;
    }
    roiTrend = Math.abs(roiTrend) < 0.05 ? 0 : parseFloat(roiTrend.toFixed(1));

    // ✅ 4. Energy Distribution
    const energyDist = { solar: 0, grid: 0, other: 0 };
    simulations.forEach((s) => {
      if (Array.isArray(s.components)) {
        s.components.forEach((c) => {
          const watt = c.watt || 0;
          if (c.type === "solar") energyDist.solar += watt;
          else if (["light", "pc"].includes(c.type)) energyDist.grid += watt;
          else energyDist.other += watt;
        });
      }
    });

    const totalWatt =
      energyDist.solar + energyDist.grid + energyDist.other || 1;
    Object.keys(energyDist).forEach((key) => {
      energyDist[key] = parseFloat(
        ((energyDist[key] / totalWatt) * 100).toFixed(1)
      );
    });

    // ✅ 5. Predictive Growth (AI logic)
    const predictedGrowth = Math.max(
      0,
      Math.min(10, (avgGreenScore / 100) * 6 + avgROI / 20)
    ).toFixed(1);

    // ✅ 6. Smart AI Suggestions (context-based)
    const suggestions = [];

    // ROI Trend Analysis
    if (roiTrend < 0)
      suggestions.push(
        "ROI trend is declining — review recent simulations for inefficiencies."
      );
    else if (roiTrend > 0)
      suggestions.push("ROI trend is improving — maintain optimized resource use.");
    else
      suggestions.push("ROI performance is stable — consistent sustainability achieved.");

    // Sustainability Insight
    if (avgGreenScore > 90)
      suggestions.push("Excellent sustainability performance maintained!");
    else if (avgGreenScore > 70)
      suggestions.push("Good sustainability — aim for higher solar ratio.");
    else
      suggestions.push("Increase renewables to boost green score and efficiency.");

    // Energy Usage
    if (avgEnergy < 2000)
      suggestions.push("Energy usage is efficiently balanced across systems.");
    else
      suggestions.push("High energy use detected — optimize AC and lighting schedules.");

    // Predictive Growth Outlook
    if (predictedGrowth > 5)
      suggestions.push("Strong ROI forecast — scale sustainable infrastructure.");
    else
      suggestions.push("Moderate growth forecast — fine-tune resource allocation.");

    // ✅ 7. Additional AI highlights
    if (avgROI > 60)
      suggestions.push("Outstanding ROI performance achieved — monitor for consistency.");
    if (energyDist.solar < 15)
      suggestions.push("Low solar contribution — consider expanding renewable capacity.");
    if (energyDist.grid > 70)
      suggestions.push("High grid dependency — potential to reduce operational cost via solar.");

    // ✅ 8. Final Structured Payload
    res.status(200).json({
      summary: {
        totalSimulations,
        avgROI: parseFloat(avgROI.toFixed(2)),
        avgGreenScore: parseFloat(avgGreenScore.toFixed(2)),
        avgEnergy: parseFloat(avgEnergy.toFixed(1)),
        roiTrend,
        predictedGrowth: parseFloat(predictedGrowth),
      },
      monthlyTrends,
      energyDist,
      suggestions,
    });
  } catch (error) {
    console.error("AI Insights Error:", error);
    res.status(500).json({ message: "Failed to generate AI insights." });
  }
};

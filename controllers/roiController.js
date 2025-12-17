// backend/controllers/roiController.js
import Simulation from "../models/Simulation.js";

export const analyzeROI = async (req, res) => {
  try {
    const simulations = await Simulation.find({ user: req.user.id });

    if (!simulations.length) {
      return res.status(200).json({
        totalSimulations: 0,
        avgROI: 0,
        avgGreenScore: 0,
        totalInvestment: 0,
        estimatedSavings: 0,
        paybackPeriod: 0,
        monthlyProjection: [],
        businessStats: [],
        avgEnergy: 0,
        co2Saved: 0,
      });
    }

    // --- Core Aggregations ---
    const totalSimulations = simulations.length;
    const avgROI =
      simulations.reduce((sum, s) => sum + (s.roi || 0), 0) /
      totalSimulations;
    const avgGreenScore =
      simulations.reduce((sum, s) => sum + (s.greenScore || 0), 0) /
      totalSimulations;
    const totalInvestment = simulations.reduce(
      (sum, s) => sum + (s.investment || 0),
      0
    );
    const estimatedSavings = simulations.reduce(
      (sum, s) => sum + (s.savings || 0),
      0
    );
    const paybackPeriod =
      estimatedSavings > 0
        ? totalInvestment / estimatedSavings
        : 0;

    // --- Monthly ROI Projection ---
    const monthlyProjection = Array.from({ length: 12 }).map((_, i) => {
      const projectedROI = avgROI + Math.sin(i / 2) * 2; // slight natural variation
      return { month: `Month ${i + 1}`, projectedROI: projectedROI.toFixed(2) };
    });

    // --- Average Energy + CO₂ Savings ---
    const avgEnergy =
      totalSimulations > 0
        ? simulations.reduce((sum, s) => sum + (s.energy || 0), 0) /
          totalSimulations
        : 0;
    const co2Saved = (avgEnergy * 0.82).toFixed(2); // ~0.82 kg CO₂ saved per kWh

    // --- Comparison by Business Type ---
    const businessStats = await Simulation.aggregate([
      {
        $match: { user: req.user._id },
      },
      {
        $group: {
          _id: "$businessType",
          avgROI: { $avg: "$roi" },
          avgGreenScore: { $avg: "$greenScore" },
          avgInvestment: { $avg: "$investment" },
          avgSavings: { $avg: "$savings" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Final Output ---
    res.status(200).json({
      totalSimulations,
      avgROI,
      avgGreenScore,
      totalInvestment,
      estimatedSavings,
      paybackPeriod,
      monthlyProjection,
      businessStats,
      avgEnergy,
      co2Saved,
    });
  } catch (error) {
    console.error("Error in ROI analysis:", error);
    res.status(500).json({ message: "Server error during ROI analysis" });
  }
};
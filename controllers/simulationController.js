import Simulation from "../models/simulation.js";

export const runSimulation = async (req, res) => {
  try {
    const { businessType, components } = req.body;

    // Compute metrics
    const totalWatt = components.reduce((sum, c) => sum + c.watt * c.hours, 0);
    const totalEnergy = (totalWatt / 1000) * 30;
    const roi = 5 + (components.length ? 50 : 0) - totalEnergy / 5000;
    const greenScore = 40 + (components.length ? 60 : 0) - totalEnergy / 2000;

    // Save to DB linked to logged-in user
    const newSim = await Simulation.create({
      user: req.user._id,
      businessType,
      components,
      roi,
      greenScore,
      energy: totalEnergy,
    });

    res.json({ success: true, data: newSim });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// For history page later
export const getUserSimulations = async (req, res) => {
  const simulations = await Simulation.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(simulations);
};

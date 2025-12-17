// backend/models/Simulation.js
import mongoose from "mongoose";

const simulationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    roi: {
      type: Number,
      required: true,
    },
    greenScore: {
      type: Number,
      required: true,
    },
    investment: {
      type: Number,
      default: 0,
    },
    savings: {
      type: Number,
      default: 0,
    },
    energy: {
      type: Number,
      default: 0,
    },
    components: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Stable export (prevents OverwriteModelError safely)
const Simulation =
  mongoose.models.Simulation || mongoose.model("Simulation", simulationSchema);

export default Simulation;

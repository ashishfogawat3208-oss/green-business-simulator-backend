// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// ✅ Import routes
import simulationRoutes from "./routes/simulationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roiRoutes from "./routes/roiRoutes.js";
import aiRoutes from "./routes/aiRoutes.js"; // 🧠 Phase 4: AI Insights Layer

dotenv.config();
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug logger to track requests
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Route mounting
app.use("/api/simulate", simulationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roi", roiRoutes);      // Phase 3: Business Intelligence Layer
app.use("/api/ai", aiRoutes);        // Phase 4: AI Insights Layer 🧠

// ✅ Default route for health check
app.get("/", (req, res) => {
  res.send("🌱 Green Business Simulator API is running...");
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
connectDB();

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
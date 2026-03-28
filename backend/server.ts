import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.get("/", (_req, res) => {
  res.json({
    name: "OmniReach Chaos Agent API",
    version: "1.0.0",
    endpoints: {
      serverHealth:        "GET /api/server-health",
      humanitarianReports: "GET /api/humanitarian-reports",
      disasterAlerts:      "GET /api/disaster-alerts",
      conflictNews:        "GET /api/conflict-news",
      chaosAnalysis:       "GET /api/chaos-analysis",
      allRawData:          "GET /api/chaos-analysis/raw-data",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
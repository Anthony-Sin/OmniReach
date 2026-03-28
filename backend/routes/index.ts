import { Router } from "express";
import serverHealthRouter        from "./serverHealth";
import humanitarianReportsRouter from "./humanitarianReports";
import disasterAlertsRouter      from "./disasterAlerts";
import conflictNewsRouter        from "./conflictNews";
import chaosAnalysisRouter       from "./chaosAnalysis";

const router = Router();

router.use("/server-health",         serverHealthRouter);
router.use("/humanitarian-reports",  humanitarianReportsRouter);
router.use("/disaster-alerts",       disasterAlertsRouter);
router.use("/conflict-news",         conflictNewsRouter);
router.use("/chaos-analysis",        chaosAnalysisRouter);

export default router;
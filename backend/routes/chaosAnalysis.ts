import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NormalizedItem, AnalysisResult } from "./types";
import { fetchHumanitarianReports } from "./humanitarianReports";
import { fetchDisasterAlerts } from "./disasterAlerts";
import { fetchConflictNews } from "./conflictNews";

const router = Router();

function buildPromptBlock(
  humanitarianReports: NormalizedItem[],
  disasterAlerts: NormalizedItem[],
  conflictNews: NormalizedItem[]
): string {
  const fmt = (items: NormalizedItem[]) =>
    items.length
      ? items.map((i) => `- Title: ${i.title}\n  Description: ${i.description}\n  Location: ${i.location}`).join("\n\n")
      : "- No data available";

  return (
    `[Humanitarian Situation Reports]\n${fmt(humanitarianReports)}\n\n` +
    `[Disaster Alerts]\n${fmt(disasterAlerts)}\n\n` +
    `[Conflict News]\n${fmt(conflictNews)}`
  );
}

async function analyzeWithGemini(dataBlock: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Review the following real-time disaster, conflict, and humanitarian data. Identify the Top 3 High-Need Areas where supply chains are most likely failing.

For each area provide:
1. Location Name
2. Chaos Level (1-10) based on severity frequency and alignment between news and official reports
3. Urgency Reason
4. Kit Recommendation specific items that should be re-dispatched

Format your response as structured JSON with this schema:
{
  "highNeedAreas": [
    {
      "rank": 1,
      "location": "string",
      "chaosLevel": number,
      "urgencyReason": "string",
      "kitRecommendation": ["item1", "item2", "item3"]
    }
  ],
  "summary": "One-paragraph overall situation summary"
}

Here is the data:

${dataBlock}`;
  const result = await model.generateContent(prompt);
  return result.response.text().replace(/```json|```/g, "").trim();
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [humanitarianResult, disasterResult, conflictResult] = await Promise.allSettled([
      fetchHumanitarianReports(),
      fetchDisasterAlerts(),
      fetchConflictNews(),
    ]);
    const humanitarianReports = humanitarianResult.status === "fulfilled" ? humanitarianResult.value : [];
    const disasterAlerts      = disasterResult.status === "fulfilled"     ? disasterResult.value      : [];
    const conflictNews        = conflictResult.status === "fulfilled"      ? conflictResult.value       : [];
    const dataBlock = buildPromptBlock(humanitarianReports, disasterAlerts, conflictNews);
    const analysisRaw = await analyzeWithGemini(dataBlock);
    let parsedAnalysis: unknown;
    try {
      parsedAnalysis = JSON.parse(analysisRaw);
    } catch {
      parsedAnalysis = { raw: analysisRaw };
    }
    const response: AnalysisResult = {
      rawData: { humanitarianReports, disasterAlerts, conflictNews },
      analysis: parsedAnalysis,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/raw-data", async (_req: Request, res: Response) => {
  try {
    const [humanitarianResult, disasterResult, conflictResult] = await Promise.allSettled([
      fetchHumanitarianReports(),
      fetchDisasterAlerts(),
      fetchConflictNews(),
    ]);
    res.json({
      humanitarianReports: humanitarianResult.status === "fulfilled" ? humanitarianResult.value : [],
      disasterAlerts:      disasterResult.status === "fulfilled"      ? disasterResult.value      : [],
      conflictNews:        conflictResult.status === "fulfilled"       ? conflictResult.value       : [],
      errors: {
        humanitarianReports: humanitarianResult.status === "rejected" ? humanitarianResult.reason?.message : null,
        disasterAlerts:      disasterResult.status === "rejected"      ? disasterResult.reason?.message      : null,
        conflictNews:        conflictResult.status === "rejected"       ? conflictResult.reason?.message       : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
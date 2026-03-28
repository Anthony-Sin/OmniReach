import { Router, Request, Response } from "express";
import { NormalizedItem } from "./types";

const router = Router();

export async function fetchConflictNews(): Promise<NormalizedItem[]> {
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=(conflict%20OR%20war%20OR%20protest)&mode=artlist&maxrecords=5&format=json&timespan=10min";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Conflict news fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.articles ?? []).map((item: any) => ({
    title: item.title ?? "No title",
    description: item.seendescription?.substring(0, 300) ?? item.socialimage ?? "No description",
    location: item.sourcecountry ?? item.domain ?? "Unknown",
  }));
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await fetchConflictNews();
    res.json({ source: "ConflictNews", data, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
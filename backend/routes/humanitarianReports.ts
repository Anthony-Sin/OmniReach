import { Router, Request, Response } from "express";
import { NormalizedItem } from "./types";

const router = Router();

export async function fetchHumanitarianReports(): Promise<NormalizedItem[]> {
  const url = "https://api.reliefweb.int/v2/reports?appname=chaos_agent&limit=5&preset=latest";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Humanitarian reports fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.data ?? []).map((item: any) => ({
    title: item.fields?.title ?? "No title",
    description: item.fields?.body?.substring(0, 300) ?? item.fields?.summary?.substring(0, 300) ?? "No description",
    location: item.fields?.country?.map((c: { name: string }) => c.name).join(", ") ?? item.fields?.source?.[0]?.country?.name ?? "Unknown",
  }));
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await fetchHumanitarianReports();
    res.json({ source: "HumanitarianReports", data, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
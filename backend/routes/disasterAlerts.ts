import { Router, Request, Response } from "express";
import { NormalizedItem } from "./types";

const router = Router();

export async function fetchDisasterAlerts(): Promise<NormalizedItem[]> {
  const url = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/JSON";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Disaster alerts fetch failed: ${res.status}`);
  const json = await res.json();
  const events: any[] = json.features ?? json.results ?? json.events ?? [];
  return events.slice(0, 5).map((item) => ({
    title: item.properties?.name ?? item.properties?.eventtype ?? item.title ?? "No title",
    description: item.properties?.description?.substring(0, 300) ?? item.description?.substring(0, 300) ?? `Alert level: ${item.properties?.alertlevel ?? "unknown"}`,
    location: item.properties?.country ?? item.properties?.iso3 ?? (item.geometry?.coordinates ? `${item.geometry.coordinates[1]}, ${item.geometry.coordinates[0]}` : "Unknown"),
  }));
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await fetchDisasterAlerts();
    res.json({ source: "DisasterAlerts", data, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
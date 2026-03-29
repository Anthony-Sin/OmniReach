/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GDACSEvent {
  eventid: number;
  eventtype: string;
  name: string;
  description: string;
  alertlevel: string;
  alertscore: number;
  episodeid: number;
  eventname: string;
  severity: string;
  country: string;
  fromdate: string;
  todate: string;
  lat: number;
  lon: number;
}

/**
 * Fetches the latest disaster events from GDACS.
 */
function extractEventArray(data: unknown): GDACSEvent[] {
  if (Array.isArray(data)) return data as GDACSEvent[];
  if (data && typeof data === 'object') {
    const possibleArray = Object.values(data).find(val => Array.isArray(val));
    if (possibleArray) return possibleArray as GDACSEvent[];
  }
  return [];
}

export async function fetchGDACSEvents(alertLevels: string[] = ['red', 'orange', 'green']): Promise<GDACSEvent[]> {
  const unique = new Map<string, GDACSEvent>();

  for (const alertLevel of alertLevels) {
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=${alertLevel}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GDACS API error for level ${alertLevel}: ${response.statusText}`);
    }

    const data = await response.json();
    const events = extractEventArray(data);
    for (const event of events) {
      unique.set(`${event.eventid}-${event.episodeid}`, event);
    }
  }

  return Array.from(unique.values());
}

/**
 * Fetches the current map feed from GDACS.
 */
export async function fetchGDACSMapFeed(): Promise<GDACSEvent[]> {
  const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/map?eventtype=ALL`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GDACS API error: ${response.statusText}`);
  }
  const data = await response.json();
  return extractEventArray(data);
}

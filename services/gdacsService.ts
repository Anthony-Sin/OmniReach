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
export async function fetchGDACSEvents(alertLevel: string = 'red'): Promise<GDACSEvent[]> {
  // Using the SEARCH endpoint as suggested in the documentation provided by the user
  const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=${alertLevel}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GDACS API error: ${response.statusText}`);
  }
  const data = await response.json();
  console.log("GDACS API response:", data);
  if (Array.isArray(data)) return data as GDACSEvent[];
  if (data && typeof data === 'object') {
    const possibleArray = Object.values(data).find(val => Array.isArray(val));
    if (possibleArray) return possibleArray as GDACSEvent[];
  }
  return [];
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
  if (Array.isArray(data)) return data as GDACSEvent[];
  if (data && typeof data === 'object') {
    const possibleArray = Object.values(data).find(val => Array.isArray(val));
    if (possibleArray) return possibleArray as GDACSEvent[];
  }
  return [];
}

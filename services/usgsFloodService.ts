export interface UsgsFloodObservation {
  siteId: string;
  value: number | null;
  unit: string | null;
}

export interface UsgsFloodContext {
  count: number;
  observations: UsgsFloodObservation[];
  floodRiskScore: number;
  summary: string;
}

export async function fetchUsgsFloodContext(alert: { lat: number; lng: number; type?: string }): Promise<UsgsFloodContext> {
  const disasterType = String(alert.type || '').toLowerCase();
  if (!['flood', 'cyclone', 'hurricane', 'typhoon'].some(token => disasterType.includes(token))) {
    return {
      count: 0,
      observations: [],
      floodRiskScore: 0,
      summary: 'USGS flood context skipped because the alert is not flood-related.'
    };
  }

  const minLng = (alert.lng - 1).toFixed(4);
  const minLat = (alert.lat - 1).toFixed(4);
  const maxLng = (alert.lng + 1).toFixed(4);
  const maxLat = (alert.lat + 1).toFixed(4);

  try {
    const url = `https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items?f=json&bbox=${minLng},${minLat},${maxLng},${maxLat}&parameter_code=00065&limit=5`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS Water API error: ${response.status}`);
    }

    const data = await response.json();
    const observations = Array.isArray(data?.features)
      ? data.features.map((feature: any) => ({
          siteId: feature?.properties?.monitoring_location_id ?? 'unknown-site',
          value: typeof feature?.properties?.result === 'number' ? feature.properties.result : null,
          unit: feature?.properties?.unit_of_measure ?? null
        }))
      : [];

    const floodRiskScore = Math.min(observations.length * 2, 10);
    return {
      count: observations.length,
      observations,
      floodRiskScore,
      summary: observations.length > 0
        ? `USGS found ${observations.length} nearby water observations relevant to flood conditions.`
        : 'USGS found no nearby flood observations.'
    };
  } catch (error) {
    console.error('USGS flood lookup failed:', error);
    return {
      count: 0,
      observations: [],
      floodRiskScore: 0,
      summary: 'USGS flood context unavailable.'
    };
  }
}

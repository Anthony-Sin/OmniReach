export interface ReliefWebReport {
  title: string;
  source: string;
  publishedAt: string;
}

export interface ReliefWebContext {
  count: number;
  reports: ReliefWebReport[];
  summary: string;
}

export async function fetchReliefWebContext(alert: { name: string; country?: string }): Promise<ReliefWebContext> {
  try {
    const response = await fetch('https://api.reliefweb.int/v2/reports?appname=aegis-disaster-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          value: `"${alert.name}"${alert.country ? ` AND "${alert.country}"` : ''}`
        },
        fields: {
          include: ['title', 'date.created', 'source.name']
        },
        limit: 3,
        sort: ['date.created:desc']
      })
    });

    if (!response.ok) {
      throw new Error(`ReliefWeb API error: ${response.status}`);
    }

    const data = await response.json();
    const reports = Array.isArray(data?.data)
      ? data.data.map((item: any) => ({
          title: item?.fields?.title ?? 'Untitled report',
          source: item?.fields?.source?.[0]?.name ?? 'Unknown source',
          publishedAt: item?.fields?.date?.created ?? ''
        }))
      : [];

    return {
      count: reports.length,
      reports,
      summary: reports.length > 0
        ? `ReliefWeb found ${reports.length} recent humanitarian reports related to ${alert.name}.`
        : `ReliefWeb found no recent humanitarian reports for ${alert.name}.`
    };
  } catch (error) {
    console.error('ReliefWeb lookup failed:', error);
    return {
      count: 0,
      reports: [],
      summary: `ReliefWeb context unavailable for ${alert.name}.`
    };
  }
}

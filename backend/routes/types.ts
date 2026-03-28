export interface NormalizedItem {
  title: string;
  description: string;
  location: string;
}

export interface AnalysisResult {
  rawData: {
    humanitarianReports: NormalizedItem[];
    disasterAlerts: NormalizedItem[];
    conflictNews: NormalizedItem[];
  };
  analysis: unknown;
  timestamp: string;
}
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { 
  KitPlanCreatedPayloadSchema, 
  ZonePrioritizedPayloadSchema, 
  PickSequenceCreatedPayloadSchema,
  DeliveryRouteCreatedPayloadSchema,
  AlertDetectedPayloadSchema
} from "../src/types/mission";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'undefined') {
    console.warn('[GeminiService] GEMINI_API_KEY is missing. AI features will use deterministic fallbacks.');
    return 'dummy-key'; // Avoid SDK crash on init
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface DisasterZone {
  id: string;
  name: string;
  type: 'flood' | 'earthquake' | 'conflict' | 'wildfire' | 'facility' | 'cyclone' | 'volcano' | 'drought';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'nominal';
  lat: number;
  lng: number;
  description?: string;
  waypoints?: [number, number, number][];
}

export interface KitRecommendation {
  kitType: string;
  items: string[];
  assemblyOrder: string[];
  missingItems: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  requiredResources: string[];
  waypoints: [number, number, number][];
}

export interface RankedEvent {
  eventid: number;
  name: string;
  country: string;
  eventtype: string;
  lat: number;
  lng: number;
  alertlevel: string;
  rank: number;
  kitType: string;
  items: string[];
  priority: string;
  reasoning: string;
  waypoints: [number, number, number][];
}

import { itemCatalog } from '../src/assets/items/index';

// --- Robust AI Call Infrastructure ---

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
};

async function callGeminiWithRetry<T>(
  params: any,
  schema: z.ZodSchema<T>,
  fallback: T,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;

  for (let i = 0; i <= config.maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      const text = response.text;
      
      // Attempt to parse JSON if expected
      if (params.config?.responseMimeType === "application/json") {
        let json: any;
        try {
          json = JSON.parse(text);
        } catch (jsonErr) {
          throw new Error(`JSON parse failed: ${jsonErr}`); // retryable
        }

        try {
          return schema.parse(json);
        } catch (zodErr) {
          console.warn('[GeminiService] Schema mismatch — using fallback immediately.', zodErr);
          return fallback; // not retryable
        }
      }
      
      // If not JSON, just return text if schema allows string
      try {
        return schema.parse(text);
      } catch (zodErr) {
        console.warn('[GeminiService] Schema mismatch (string) — using fallback immediately.', zodErr);
        return fallback; // not retryable
      }
    } catch (error) {
      lastError = error;
      console.error(`[GeminiService] Attempt ${i + 1} failed:`, error);
      
      if (i < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  console.warn(`[GeminiService] All retries failed. Using deterministic fallback.`);
  return fallback;
}

// --- Agent-to-Agent Service Methods ---

export async function getKitRecommendation(zone: DisasterZone, specialization?: string, constraints?: string): Promise<any> {
  const catalogByCategory = itemCatalog.reduce((acc: Record<string, string[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item.name);
    return acc;
  }, {});

  const fallback = {
    kitType: "Standard Emergency Kit",
    items: ["Water Purification Tablets", "First Aid Kit", "Emergency Rations"],
    assemblyOrder: ["Water Purification Tablets", "First Aid Kit", "Emergency Rations"],
    missingItems: [],
    priority: "medium" as const,
    reasoning: "Fallback recommendation due to AI unavailability.",
    requiredResources: ["Standard Logistics Drone"],
    waypoints: [[0.5, 0, 0.3], [0.5, 0.2, 0.3], [0.5, -0.2, 0.3]] as [number, number, number][]
  };

  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Analyze this disaster zone and recommend a robotic intervention kit.
      Zone: ${zone.name}
      Type: ${zone.type}
      Severity: ${zone.severity}
      Description: ${zone.description}
      ${constraints ? `Special Constraints: ${constraints}` : ''}
      
      Kit specialization: ${specialization ?? 'GENERAL'}
  
      Full item catalog grouped by category:
      ${JSON.stringify(catalogByCategory, null, 2)}
      
      Instructions: Select items that best serve a ${specialization ?? 'general emergency'} 
      response. Prioritize categories most relevant to this specialization. 
      Do not include items from irrelevant categories.`,
      config: {
        systemInstruction: `You are an emergency logistics AI. 
        Recommend a specific kit for robotic assembly. 
        Select items ONLY from the provided catalog. 
        If an item is critical but not in the catalog, do NOT include it in 'items' but mention it in 'reasoning'.
        Provide a logical 'assemblyOrder' (the order in which the robotic arm should pick and place the items).
        Provide 3 waypoints (x, y, z) for the Aegis Assembly Arm to reach during assembly. 
        X should be between 0.3 and 0.7, Y between -0.4 and 0.4, Z between 0.1 and 0.6.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kitType: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.STRING } },
            assemblyOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            reasoning: { type: Type.STRING },
            requiredResources: { type: Type.ARRAY, items: { type: Type.STRING } },
            waypoints: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER },
                minItems: 3,
                maxItems: 3
              },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["kitType", "items", "assemblyOrder", "priority", "reasoning", "requiredResources", "waypoints", "missingItems"]
        }
      }
    },
    KitPlanCreatedPayloadSchema,
    fallback
  );
}

export async function rankGDACSEvents(events: any[]): Promise<any> {
  const fallback = events.slice(0, 5).map((e, i) => ({
    eventid: e.eventid,
    name: e.name,
    country: e.country,
    eventtype: e.eventtype || 'flood',
    lat: e.lat || 0,
    lng: e.lon || 0,
    alertlevel: e.alertlevel || 'green',
    rank: i + 1,
    kitType: "Standard Kit",
    items: ["Water"],
    priority: "medium",
    reasoning: "Fallback ranking.",
    waypoints: [[0.5, 0, 0.3], [0.5, 0.1, 0.3], [0.5, -0.1, 0.3]]
  }));

  // Note: The original rankGDACSEvents returns an array. 
  // We wrap the schema in z.array()
  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Rank these global disaster events based on their suitability for robotic intervention. 
      Events: ${JSON.stringify(events.slice(0, 10))}`,
      config: {
        systemInstruction: "Rank disaster events and recommend kits. Return a JSON array of the top 5.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              eventid: { type: Type.NUMBER },
              name: { type: Type.STRING },
              country: { type: Type.STRING },
              eventtype: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              alertlevel: { type: Type.STRING },
              rank: { type: Type.NUMBER },
              kitType: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              priority: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              waypoints: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } }
            },
            required: ["eventid", "name", "country", "rank", "kitType", "items", "priority", "reasoning", "waypoints"]
          }
        }
      }
    },
    z.array(z.any()), // Simplified for ranking as it's a list of complex objects
    fallback
  );
}

export async function summarizeAlerts(alerts: any[]): Promise<string> {
  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Summarize these alerts: ${JSON.stringify(alerts)}`,
      config: {
        systemInstruction: "Provide a concise 2-3 sentence summary of the disaster landscape.",
      }
    },
    z.string(),
    "Summary unavailable. Multiple disaster alerts detected globally."
  );
}

export async function explainLogisticsSequence(kitType: string, steps: any[]): Promise<string> {
  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Explain sequence for ${kitType}: ${JSON.stringify(steps)}`,
      config: {
        systemInstruction: "Provide a 1-2 sentence technical explanation of the sequence optimization.",
      }
    },
    z.string(),
    "Sequence optimized for standard robotic pick-and-place safety protocols."
  );
}

export async function generateRouteNarrative(source: string, destination: string, transportMode: string, riskFlags: string[]): Promise<string> {
  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Route from ${source} to ${destination} via ${transportMode}. Risks: ${riskFlags.join(', ')}`,
      config: {
        systemInstruction: "Provide a 1-2 sentence narrative of the planned delivery route.",
      }
    },
    z.string(),
    `Planned ${transportMode} delivery route from ${source} to ${destination} following safety corridors.`
  );
}

export async function generateMissionSummary(missionData: any): Promise<string> {
  return callGeminiWithRetry(
    {
      model: "gemini-3-flash-preview",
      contents: `Mission summary for: ${JSON.stringify(missionData)}`,
      config: {
        systemInstruction: "Provide a 2-3 sentence professional summary of the mission's outcome.",
      }
    },
    z.string(),
    "Mission completed successfully. Robotic intervention and delivery finalized according to emergency protocols."
  );
}

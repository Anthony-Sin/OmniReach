type Pricing = {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

type Reservation = {
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
};

type UsageMetadataLike = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

const DEFAULT_BUDGET_USD = Number(process.env.GEMINI_MAX_BUDGET_USD ?? '1');
const DEFAULT_MAX_CALLS = Number(process.env.GEMINI_MAX_CALLS ?? '8');
const DEFAULT_MAX_INPUT_TOKENS = Number(process.env.GEMINI_MAX_INPUT_TOKENS ?? '250000');
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? '50000');
const IMAGE_TOKEN_ESTIMATE = Number(process.env.GEMINI_IMAGE_TOKEN_ESTIMATE ?? '8192');

const FLASH_PRICING: Pricing = {
  inputPerMillionUsd: 0.3,
  outputPerMillionUsd: 2.5
};

const FLASH_LITE_PRICING: Pricing = {
  inputPerMillionUsd: 0.1,
  outputPerMillionUsd: 0.4
};

const usageState = {
  missionStarts: 0,
  mapLoads: 0,
  gemini: {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    blockedCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    budgetUsd: DEFAULT_BUDGET_USD,
    maxCalls: DEFAULT_MAX_CALLS,
    maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
    maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    lastBlockedReason: null as string | null
  }
};

function charsToTokens(value: string) {
  return Math.ceil(value.length / 3);
}

function estimateTokensFromUnknown(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'string') return charsToTokens(value);
  if (typeof value === 'number' || typeof value === 'boolean') return charsToTokens(String(value));
  if (Array.isArray(value)) return value.reduce((sum, entry) => sum + estimateTokensFromUnknown(entry), 0);

  if (typeof value === 'object') {
    let total = 0;
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'text' && typeof entry === 'string') {
        total += charsToTokens(entry);
        continue;
      }
      if ((key === 'inlineData' || key === 'fileData') && entry) {
        total += IMAGE_TOKEN_ESTIMATE;
        continue;
      }
      if (key === 'model' || key === 'mimeType') {
        continue;
      }
      total += estimateTokensFromUnknown(entry);
    }
    return total;
  }

  return 0;
}

function getPricingForModel(model: string): Pricing {
  const normalized = model.toLowerCase();
  if (normalized.includes('flash-lite')) {
    return FLASH_LITE_PRICING;
  }
  return FLASH_PRICING;
}

function calculateCostUsd(model: string, inputTokens: number, outputTokens: number) {
  const pricing = getPricingForModel(model);
  return (inputTokens / 1_000_000) * pricing.inputPerMillionUsd
    + (outputTokens / 1_000_000) * pricing.outputPerMillionUsd;
}

export function reserveGeminiUsage(model: string, contents: unknown, maxOutputTokens: number) {
  const estimatedInputTokens = estimateTokensFromUnknown(contents);
  const estimatedOutputTokens = Math.max(0, maxOutputTokens);
  const estimatedCostUsd = calculateCostUsd(model, estimatedInputTokens, estimatedOutputTokens);

  const projectedCalls = usageState.gemini.totalCalls + 1;
  const projectedInputTokens = usageState.gemini.inputTokens + estimatedInputTokens;
  const projectedOutputTokens = usageState.gemini.outputTokens + estimatedOutputTokens;
  const projectedCostUsd = usageState.gemini.estimatedCostUsd + estimatedCostUsd;

  let blockedReason: string | null = null;

  if (projectedCalls > usageState.gemini.maxCalls) {
    blockedReason = `Gemini call cap reached (${usageState.gemini.maxCalls}).`;
  } else if (projectedInputTokens > usageState.gemini.maxInputTokens) {
    blockedReason = `Gemini input token cap reached (${usageState.gemini.maxInputTokens}).`;
  } else if (projectedOutputTokens > usageState.gemini.maxOutputTokens) {
    blockedReason = `Gemini output token cap reached (${usageState.gemini.maxOutputTokens}).`;
  } else if (projectedCostUsd > usageState.gemini.budgetUsd) {
    blockedReason = `Gemini budget cap reached ($${usageState.gemini.budgetUsd.toFixed(2)}).`;
  }

  if (blockedReason) {
    usageState.gemini.blockedCalls += 1;
    usageState.gemini.lastBlockedReason = blockedReason;
    return { allowed: false as const, reason: blockedReason };
  }

  usageState.gemini.totalCalls = projectedCalls;
  usageState.gemini.inputTokens = projectedInputTokens;
  usageState.gemini.outputTokens = projectedOutputTokens;
  usageState.gemini.estimatedCostUsd = projectedCostUsd;
  usageState.gemini.lastBlockedReason = null;

  return {
    allowed: true as const,
    reservation: {
      model,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUsd
    } satisfies Reservation
  };
}

export function finalizeGeminiUsage(
  reservation: Reservation,
  options: { success: boolean; usageMetadata?: UsageMetadataLike | null }
) {
  const actualInputTokens = Number.isFinite(Number(options.usageMetadata?.promptTokenCount))
    ? Number(options.usageMetadata?.promptTokenCount)
    : reservation.estimatedInputTokens;
  const actualOutputTokens = Number.isFinite(Number(options.usageMetadata?.candidatesTokenCount))
    ? Number(options.usageMetadata?.candidatesTokenCount)
    : Number.isFinite(Number(options.usageMetadata?.totalTokenCount))
      ? Math.max(0, Number(options.usageMetadata?.totalTokenCount) - actualInputTokens)
      : reservation.estimatedOutputTokens;

  const actualCostUsd = calculateCostUsd(reservation.model, actualInputTokens, actualOutputTokens);

  usageState.gemini.inputTokens += actualInputTokens - reservation.estimatedInputTokens;
  usageState.gemini.outputTokens += actualOutputTokens - reservation.estimatedOutputTokens;
  usageState.gemini.estimatedCostUsd += actualCostUsd - reservation.estimatedCostUsd;

  if (options.success) {
    usageState.gemini.successfulCalls += 1;
  } else {
    usageState.gemini.failedCalls += 1;
  }
}

export function registerMissionStart() {
  usageState.missionStarts += 1;
}

export function registerMapLoad() {
  usageState.mapLoads += 1;
}

export function getApiUsageSnapshot() {
  return {
    missionStarts: usageState.missionStarts,
    mapLoads: usageState.mapLoads,
    gemini: {
      ...usageState.gemini,
      remainingUsd: Math.max(0, usageState.gemini.budgetUsd - usageState.gemini.estimatedCostUsd)
    }
  };
}


import { v4 as uuidv4 } from 'uuid';
import { MissionEvent, AgentType, MissionEventType, MissionStatus, MissionState } from '../types/mission';

export const createEventId = () => uuidv4();
export const createTraceId = () => `trace-${Math.random().toString(36).substr(2, 9)}`;

export const createEvent = <T>(
  missionId: string,
  sourceAgent: AgentType,
  type: MissionEventType,
  payload: T,
  options: {
    targetAgent?: AgentType;
    status?: MissionStatus;
    confidence?: number;
    rationale?: string;
    errors?: string[];
    duration?: number;
    retryCount?: number;
  } = {}
): MissionEvent<T> => ({
  missionId,
  traceId: createTraceId(),
  sourceAgent,
  targetAgent: options.targetAgent,
  timestamp: Date.now(),
  duration: options.duration,
  type,
  confidence: options.confidence ?? 1.0,
  status: options.status ?? 'SUCCESS',
  payload,
  rationale: options.rationale ?? '',
  errors: options.errors,
  retryCount: options.retryCount
});

export const appendMissionHistory = (state: MissionState, event: MissionEvent): MissionState => {
  // Calculate duration if not provided
  if (!event.duration && state.events.length > 0) {
    const lastEvent = state.events[state.events.length - 1];
    event.duration = event.timestamp - lastEvent.timestamp;
  } else if (!event.duration && state.data.startTime) {
    event.duration = event.timestamp - state.data.startTime;
  }

  return {
    ...state,
    events: [...state.events, event]
  };
};

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  retries = 3,
  initialDelay = 1000,
  fallback?: T
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn(i);
    } catch (error) {
      if (i === retries) {
        if (fallback !== undefined) return fallback;
        throw error;
      }
      console.warn(`[AgentUtils] Attempt ${i + 1} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Retry logic failed unexpectedly");
}

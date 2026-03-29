
import { Agent, Tool } from '../lib/adk';
import { MissionEvent, MissionState, MissionProgress, MissionEventType, MissionQueueEntry, KitSpecialization, MissionPriority, AgentRequestType, AgentRequestEvent, AgentType } from '../types/mission';
import { sentinelAgent } from './SentinelAgent';
import { triageAgent } from './TriageAgent';
import { assemblyAgent } from './AssemblyAgent';
import { logisticsAgent } from './LogisticsAgent';
import { roboticsAgent } from './RoboticsAgent';
import { deliveryAgent } from './DeliveryAgent';
import { inventoryAgent } from './InventoryAgent';
import { appendMissionHistory, createEventId, createEvent } from '../lib/agentUtils';
import { generateMissionSummary } from '../../services/geminiService';
import { missionStore } from '../lib/missionStore';
import { FACILITY_LOCATION } from '../../constants';
import { CoordinatorInputSchema, CoordinatorOutputSchema, CoordinatorQueryActiveZonesInputSchema, CoordinatorQueryActiveZonesOutputSchema } from '../types/adk';

const EVENT_ORDER = [
  MissionEventType.ALERT_DETECTED,
  MissionEventType.ZONE_PRIORITIZED,
  MissionEventType.KIT_PLAN_CREATED,
  MissionEventType.PICK_SEQUENCE_CREATED,
  MissionEventType.ARM_EXECUTION_STARTED,
  MissionEventType.ARM_EXECUTION_COMPLETED,
  MissionEventType.DELIVERY_ROUTE_CREATED,
  MissionEventType.DELIVERY_DELAYED_WEATHER,
  MissionEventType.DRONE_LAUNCHED,
  MissionEventType.DRONE_WAYPOINT_REACHED,
  MissionEventType.DRONE_ARRIVED,
  MissionEventType.MISSION_COMPLETE
];

export class CoordinatorAgentClass {
  private static _unsubscribe: (() => void) | null = null;
  private static queue: MissionQueueEntry[] = [];
  private static pending_queue: { missionId: string, severity: string, alerts: any[] }[] = [];
  private static maxConcurrent = 3;

  static init() {
    if (this._unsubscribe) this._unsubscribe();
    
    // Listen to ADK messages from sub-agents
    this._unsubscribe = coordinatorAgent.onMessage((message) => {
      console.log(`[Coordinator] Received ADK message:`, message);
      if (message && typeof message === 'object' && 'type' in message && 'missionId' in message) {
        // Bridge to handleEvent
        this.handleEvent(message as MissionEvent);
      }
    });
  }

  static async startNewMission(userSelectedZone?: any) {
    const missionId = `mission-${createEventId()}`;
    const initialState: MissionState = {
      id: missionId,
      progress: MissionProgress.MONITORING,
      currentStep: AgentType.SENTINEL,
      events: [],
      data: {
        selectedZone: userSelectedZone,
        startTime: Date.now()
      }
    };
    missionStore.setMission(missionId, initialState);
    
    // Watchdog: Fail mission if it hangs for too long
    const MISSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    setTimeout(() => {
      const m = missionStore.getMission(missionId);
      if (m && m.progress !== MissionProgress.COMPLETED && m.progress !== MissionProgress.FAILED) {
        console.error(`[Coordinator] Mission ${missionId} timed out.`);
        const timeoutEvent = createEvent(
          missionId,
          AgentType.COORDINATOR,
          MissionEventType.MISSION_FAILED,
          { error: 'Mission execution exceeded 5 minute timeout limit.' },
          { 
            status: 'ERROR',
            errors: ['TIMEOUT'],
            rationale: 'The mission failed to complete within the safety time window.'
          }
        );
        this.handleEvent(timeoutEvent);
      }
    }, MISSION_TIMEOUT_MS);

    // Kick off the pipeline via ADK
    await coordinatorAgent.runTool('startMonitoring', { missionId }, { targetAgent: AgentType.SENTINEL });
    return missionId;
  }

  static enqueueMission(zone: any, specialization: KitSpecialization) {
    const priority = specialization === KitSpecialization.SEARCH_RESCUE
      ? MissionPriority.CRITICAL
      : specialization === KitSpecialization.MEDICAL
      ? MissionPriority.HIGH
      : MissionPriority.STANDARD;

    const missionId = `mission-${createEventId()}`;
    this.queue.push({ missionId, priority, specialization, zone, enqueuedAt: Date.now() });
    this.queue.sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);
    missionStore.setMission(missionId, {
      id: missionId,
      progress: MissionProgress.QUEUED,
      currentStep: AgentType.COORDINATOR,
      events: [],
      data: { selectedZone: zone, kitSpecialization: specialization, startTime: Date.now() }
    });
    this.drainQueue();
    return missionId;
  }

  private static drainQueue() {
    const getActiveCount = () => Array.from(missionStore.getActiveMissions()).filter(m =>
      m.progress !== MissionProgress.COMPLETED &&
      m.progress !== MissionProgress.FAILED &&
      m.progress !== MissionProgress.QUEUED &&
      m.progress !== MissionProgress.TRIAGE_QUEUED
    ).length;

    while (getActiveCount() < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift()!;
      const mission = missionStore.getMission(next.missionId)!;
      mission.progress = MissionProgress.MONITORING;
      missionStore.setMission(next.missionId, mission);
      coordinatorAgent.runTool('startMonitoring', { missionId: next.missionId }, { targetAgent: AgentType.SENTINEL });
    }

    this.dispatchNext();
  }

  static getQueue() {
    return this.pending_queue;
  }

  private static evaluateSeverity(alerts: any[]) {
    const priorities: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return alerts.reduce((highest, alert) => {
      if (priorities[alert.severity] < priorities[highest]) return alert.severity;
      return highest;
    }, 'low');
  }

  private static sortQueue() {
    const priorities: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    this.pending_queue.sort((a, b) => priorities[a.severity] - priorities[b.severity]);
    
    if (this.pending_queue.length > 1) {
      const top = this.pending_queue[0];
      const second = this.pending_queue[1];
      if (priorities[top.severity] < priorities[second.severity]) {
        console.log(`[Coordinator] Decision: Prioritizing Mission ${top.missionId} over ${second.missionId} due to severity ${top.severity}.`);
      }
    }
  }

  private static async dispatchNext() {
    const getActiveCount = () => Array.from(missionStore.getActiveMissions()).filter(m =>
      m.progress !== MissionProgress.COMPLETED &&
      m.progress !== MissionProgress.FAILED &&
      m.progress !== MissionProgress.QUEUED &&
      m.progress !== MissionProgress.TRIAGE_QUEUED
    ).length;

    if (getActiveCount() < this.maxConcurrent && this.pending_queue.length > 0) {
      const next = this.pending_queue.shift()!;
      const mission = missionStore.getMission(next.missionId)!;
      mission.progress = MissionProgress.TRIAGING;
      mission.currentStep = AgentType.TRIAGE;
      missionStore.setMission(next.missionId, mission);
      await coordinatorAgent.runTool('prioritize', { missionId: next.missionId, alerts: next.alerts }, { targetAgent: AgentType.TRIAGE });
    }
  }

  private static async handleEvent(event: MissionEvent) {
    let mission = missionStore.getMission(event.missionId);
    if (!mission) return;

    // 1. Enforce Event Order & Idempotency
    if (mission.progress === MissionProgress.COMPLETED || mission.progress === MissionProgress.FAILED) {
      console.log(`[Coordinator] Mission ${event.missionId} already in final state ${mission.progress}. Ignoring event ${event.type}.`);
      return;
    }

    const isStatusEvent = 
      event.type === MissionEventType.AGENT_THINKING || 
      event.type === MissionEventType.AGENT_WAITING ||
      event.type === MissionEventType.ROBOT_ARM_STATUS;
    
    const existingEvent = mission.events.find(e => e.type === event.type);
    if (existingEvent && event.status !== 'RETRYING' && !isStatusEvent) {
      console.log(`[Coordinator] Idempotency check: Event ${event.type} already processed for mission ${event.missionId}`);
      return;
    }

    // Handle failure events immediately to avoid order check issues
    if (event.type === MissionEventType.MISSION_FAILED) {
      console.error(`[Coordinator] Mission ${event.missionId} failed:`, event.errors);
      mission.progress = MissionProgress.FAILED;
      mission = appendMissionHistory(mission, event);
      missionStore.setMission(event.missionId, mission);
      
      // Release inventory on failure
      await this.releaseInventory(mission);
      
      this.drainQueue();
      return;
    }

    // Status events don't advance the state machine or need order checks
    if (isStatusEvent) {
      mission = appendMissionHistory(mission, event);
      missionStore.setMission(event.missionId, mission);
      return;
    }

    const lastEvent = mission.events[mission.events.length - 1];
    const currentIndex = EVENT_ORDER.indexOf(event.type);
    const lastIndex = lastEvent ? EVENT_ORDER.indexOf(lastEvent.type) : -1;

    // Reject out-of-order events
    if (currentIndex !== -1 && currentIndex < lastIndex) {
      console.warn(`[Coordinator] Rejecting out-of-order event: ${event.type} after ${lastEvent?.type}`);
      return;
    }

    // 2. Update Mission State with Tracing
    if (event.type === MissionEventType.MISSION_COMPLETE) {
      mission.progress = MissionProgress.COMPLETED;
      // Generate final summary if not already present
      if (!event.payload.summary || event.payload.summary === 'Kit delivered successfully to the target zone.') {
        try {
          const summary = await generateMissionSummary(mission.data);
          event = {
            ...event,
            payload: {
              ...event.payload,
              summary
            }
          };
        } catch (e) {
          console.warn('Failed to generate AI mission summary:', e);
        }
      }
    }

    mission = appendMissionHistory(mission, event);
    missionStore.setMission(event.missionId, mission);

    if (event.status === 'ERROR') {
      if (mission.currentStep === AgentType.SENTINEL && !mission.data.retryCount) {
        console.warn(`[Coordinator] Mission ${event.missionId} failed at SENTINEL. Attempting retry...`);
        mission.progress = MissionProgress.RETRYING;
        mission.data.retryCount = 1;
        missionStore.setMission(event.missionId, mission);
        setTimeout(() => coordinatorAgent.runTool('startMonitoring', { missionId: event.missionId }, { targetAgent: AgentType.SENTINEL }), 3000);
        return;
      }

      console.error(`[Coordinator] Mission ${event.missionId} failed at step ${event.type}:`, event.errors);
      mission.progress = MissionProgress.FAILED;
      this.drainQueue();
      return;
    }

    // 3. State Machine Logic
    switch (event.type) {
      case MissionEventType.ALERT_DETECTED:
        if (mission.progress === MissionProgress.MONITORING) {
          mission.data.rawEvents = event.payload.alerts;
          const severity = this.evaluateSeverity(event.payload.alerts);
          mission.progress = MissionProgress.TRIAGE_QUEUED;
          missionStore.setMission(event.missionId, mission);
          
          this.pending_queue.push({ 
            missionId: event.missionId, 
            severity, 
            alerts: event.payload.alerts 
          });
          this.sortQueue();
          this.dispatchNext();
        }
        break;

      case MissionEventType.AUTO_DEPLOY_TRIGGERED:
        event.payload.deployments.forEach((d: any) => {
          d.specializations.forEach((spec: KitSpecialization) => {
            this.enqueueMission(d.zone, spec);
          });
        });
        break;

      case MissionEventType.ZONE_PRIORITIZED:
        mission.data.selectedZone = event.payload.zone;
        mission.data.rankedEvents = event.payload.ranked;
        mission.progress = MissionProgress.PLANNING;
        mission.currentStep = AgentType.ASSEMBLY;
        await coordinatorAgent.runTool('planKit', {
          missionId: event.missionId,
          zone: event.payload.zone,
          specialization: mission.data.kitSpecialization,
          constraints: event.payload.constraints?.join(', ')
        }, { targetAgent: AgentType.ASSEMBLY });
        break;

      case MissionEventType.KIT_PLAN_CREATED:
        mission.data.recommendation = event.payload;
        mission.progress = MissionProgress.SEQUENCING;
        mission.currentStep = AgentType.LOGISTICS;
        await coordinatorAgent.runTool('createPickSequence', { missionId: event.missionId, recommendation: event.payload }, { targetAgent: AgentType.LOGISTICS });
        break;

      case MissionEventType.PICK_SEQUENCE_CREATED:
        mission.data.pickSequence = event.payload.steps;
        mission.progress = MissionProgress.EXECUTING;
        mission.currentStep = AgentType.ROBOTICS;
        await coordinatorAgent.runTool('execute', { missionId: event.missionId, pickSequence: event.payload }, { targetAgent: AgentType.ROBOTICS });
        break;

      case MissionEventType.ARM_EXECUTION_STARTED:
        mission.data.executionStatus = 'EXECUTING';
        break;

      case MissionEventType.ARM_EXECUTION_COMPLETED:
        mission.data.executionStatus = 'COMPLETED';
        mission.progress = MissionProgress.DELIVERING;
        mission.currentStep = AgentType.DELIVERY;
        if (mission.data.selectedZone) {
          await coordinatorAgent.runTool('planRoute', {
            missionId: event.missionId,
            start: FACILITY_LOCATION,
            end: mission.data.selectedZone
          }, { targetAgent: AgentType.DELIVERY });
        }
        break;

      case MissionEventType.DELIVERY_ROUTE_CREATED:
        mission.data.route = event.payload;
        break;
      
      case MissionEventType.DELIVERY_DELAYED_WEATHER:
        mission.progress = MissionProgress.FAILED;
        mission.data.executionStatus = 'DELAYED_WEATHER';
        await this.releaseInventory(mission);
        this.drainQueue();
        break;

      case MissionEventType.DRONE_LAUNCHED:
        mission.data.droneStatus = 'IN_FLIGHT';
        mission.data.dronePosition = {
          lat: event.payload.currentLat,
          lng: event.payload.currentLng,
        };
        break;

      case MissionEventType.DRONE_WAYPOINT_REACHED:
        mission.data.dronePosition = {
          lat: event.payload.currentLat,
          lng: event.payload.currentLng,
        };
        mission.data.dronePercent = event.payload.percentComplete;
        break;

      case MissionEventType.DRONE_ARRIVED:
        mission.data.droneStatus = 'ARRIVED';
        mission.data.dronePercent = 100;
        break;

      case MissionEventType.MISSION_COMPLETE:
        await this.releaseInventory(mission);
        this.drainQueue();
        break;
    }
  }

  private static async releaseInventory(mission: MissionState) {
    const items = mission.data.recommendation?.items;
    if (items && items.length > 0) {
      console.log(`[Coordinator] Releasing inventory for mission ${mission.id}...`);
      for (const item of items) {
        try {
          await coordinatorAgent.runTool('release', { item, missionId: mission.id }, { targetAgent: AgentType.INVENTORY });
        } catch (err) {
          console.error(`[Coordinator] Failed to release item ${item}:`, err);
        }
      }
    }
  }

  static getActiveMissions() {
    return missionStore.getActiveMissions();
  }

  static getMission(id: string) {
    return missionStore.getMission(id);
  }

  static queryActiveZones() {
    const activeZoneIds = Array.from(missionStore.getActiveMissions())
      .filter(m =>
        m.progress !== MissionProgress.COMPLETED &&
        m.progress !== MissionProgress.FAILED
      )
      .map(m => m.data.selectedZone?.id)
      .filter(Boolean);
    return { activeZoneIds };
  }
}

export const coordinatorTool = new Tool({
  name: 'startMission',
  description: 'Starts a new rescue mission.',
  inputSchema: CoordinatorInputSchema,
  outputSchema: CoordinatorOutputSchema,
  run: async ({ zone }) => {
    const missionId = await CoordinatorAgentClass.startNewMission(zone);
    return { success: true, missionId };
  }
});

export const queryActiveZonesTool = new Tool({
  name: 'queryActiveZones',
  description: 'Queries currently active mission zones to avoid duplication.',
  inputSchema: CoordinatorQueryActiveZonesInputSchema,
  outputSchema: CoordinatorQueryActiveZonesOutputSchema,
  run: async () => {
    return CoordinatorAgentClass.queryActiveZones();
  }
});

export const coordinatorAgent = new Agent({
  name: AgentType.COORDINATOR,
  description: 'Orchestrates the entire rescue mission pipeline.',
  tools: [coordinatorTool, queryActiveZonesTool],
  subAgents: [
    sentinelAgent,
    triageAgent,
    assemblyAgent,
    logisticsAgent,
    roboticsAgent,
    deliveryAgent,
    inventoryAgent
  ]
});

export const CoordinatorAgent = CoordinatorAgentClass;

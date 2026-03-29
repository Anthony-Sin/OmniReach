
import { Agent, Tool } from '../lib/adk';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, DeliveryRouteCreatedPayloadSchema, DeliveryTelemetryPayloadSchema, AgentType } from '../types/mission';
import { RoutePlanner } from '../lib/routePlanner';
import { generateRouteNarrative } from '../../services/geminiService';
import { fetchWeather } from '../../services/weatherService';
import { DeliveryInputSchema, DeliveryOutputSchema } from '../types/adk';

export class DeliveryAgent {
  static async planRoute(missionId: string, sourceZone: any, targetZone: any, context: any) {
    try {
      if (
        typeof sourceZone?.lat !== 'number' ||
        typeof sourceZone?.lng !== 'number' ||
        typeof targetZone?.lat !== 'number' ||
        typeof targetZone?.lng !== 'number'
      ) {
        throw new Error('Source and target coordinates are required to plan a delivery route.');
      }

      // 1. Fetch real-time weather data for environmental awareness
      const weather = await fetchWeather(targetZone.lat, targetZone.lng);
      const weatherRisk = weather.riskLevel;
      const isHighRisk = weather.isHighRisk;

      // 2. Evaluate weather risk and determine transport mode
      let transportMode: 'DRONE' | 'GROUND_ROVER' | 'GROUND_ROBOT' | 'AIR_DROP' = 'DRONE';
      let status: 'PROCEED' | 'DELAYED_WEATHER' = 'PROCEED';

      if (isHighRisk) {
        console.log(`[DeliveryAgent] Decision: Switched to GROUND_ROVER due to High Weather Risk (Level ${weatherRisk}).`);
        transportMode = 'GROUND_ROVER';
        
        // Simulation: If risk is extreme (e.g. > 9), even ground rover is delayed
        if (weatherRisk > 9) {
          status = 'DELAYED_WEATHER';
        }
      } else {
        console.log(`[DeliveryAgent] Decision: Proceeding with DRONE delivery (Weather Risk Level ${weatherRisk}).`);
      }

      if (status === 'DELAYED_WEATHER') {
        const delayEvent = createEvent(
          missionId,
          AgentType.DELIVERY,
          MissionEventType.DELIVERY_DELAYED_WEATHER,
          { weatherRisk, reason: 'Extreme weather conditions prevent all transport modes.' },
          { rationale: `Weather risk level ${weatherRisk} exceeds safety thresholds for both aerial and ground deployment.` }
        );
        context.agent.sendMessage(AgentType.COORDINATOR, delayEvent);
        return;
      }

      // 3. Emit thinking status
      const thinkingEvent = createEvent(
        missionId,
        AgentType.DELIVERY,
        MissionEventType.AGENT_THINKING,
        { message: `Calculating ${transportMode.toLowerCase()} path to ${targetZone.name}...` },
        { rationale: `Evaluating ${transportMode} feasibility given weather risk level ${weatherRisk}.` }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, thinkingEvent);

      // 4. Generate deterministic route using the planner module
      const routeData = RoutePlanner.generateRoute(
        { lat: sourceZone.lat, lng: sourceZone.lng },
        { lat: targetZone.lat, lng: targetZone.lng }
      );

      // 5. AI Narrative for the route (handled in geminiService with retries)
      const routeNarrative = await generateRouteNarrative(
        sourceZone.name || 'Handoff Point',
        targetZone.name,
        transportMode,
        routeData.riskFlags || []
      );

      const payload = {
        waypoints: routeData.waypoints || [],
        fallbackWaypoints: routeData.fallbackWaypoints,
        transportMode: transportMode,
        eta: transportMode === 'DRONE' ? (routeData.eta || 300) : (routeData.eta || 300) * 2.5, // Ground is slower
        riskFlags: routeData.riskFlags || [],
        routeNarrative,
        constraints: routeData.constraints,
        weatherRisk
      };

      // Validate payload
      DeliveryRouteCreatedPayloadSchema.parse(payload);

      // 6. Emit the route
      const routeEvent = createEvent(
        missionId,
        AgentType.DELIVERY,
        MissionEventType.DELIVERY_ROUTE_CREATED,
        payload,
        { rationale: `Calculated an optimal ${transportMode} path with ${payload.waypoints.length} waypoints. Weather Risk: ${weatherRisk}.` }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, routeEvent);

      // 7. Start flight/drive simulation (fire and forget)
      this.simulateDelivery(missionId, payload.waypoints, targetZone, payload.eta, transportMode, context);

    } catch (error: any) {
      console.error('DeliveryAgent Error:', error);
      const failEvent = createEvent(
        missionId,
        AgentType.DELIVERY,
        MissionEventType.MISSION_FAILED,
        { 
          reason: 'Route calculation or weather assessment failed.',
          failedAgent: AgentType.DELIVERY,
          errors: [error.message],
          canRetry: true
        },
        { 
          status: 'ERROR',
          errors: [error.message],
          rationale: 'Route calculation or weather assessment failed.'
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    }
  }

  private static async simulateDelivery(missionId: string, waypoints: number[][], targetZone: any, eta: number, transportMode: string, context: any) {
    const deliveryStartTime = Date.now();
    const totalWaypoints = waypoints.length;
    if (totalWaypoints === 0) return;

    const targetLat = waypoints[totalWaypoints - 1][0];
    const targetLng = waypoints[totalWaypoints - 1][1];

    const eventType = MissionEventType.DELIVERY_DISPATCHED;
    const waypointType = MissionEventType.DELIVERY_WAYPOINT_REACHED;
    const arrivedType = MissionEventType.DELIVERY_ARRIVED;

    // 1. Emits LAUNCHED immediately
    const launchedEvent = createEvent(
      missionId,
      AgentType.DELIVERY,
      eventType,
      {
        transportMode: transportMode as 'DRONE' | 'GROUND_ROBOT' | 'AIR_DROP' | 'GROUND_ROVER',
        waypointIndex: 0,
        totalWaypoints,
        currentLat: waypoints[0][0],
        currentLng: waypoints[0][1],
        targetLat,
        targetLng,
        etaSeconds: eta,
        percentComplete: 0
      },
      { rationale: `${transportMode} deployed towards ${targetZone.name}.` }
    );
    context.agent.sendMessage(AgentType.COORDINATOR, launchedEvent);

    // 2. Loops through waypoints index 1 to end
    for (let i = 1; i < totalWaypoints; i++) {
      const delay = (eta / totalWaypoints) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 2000))); 

      const payload = {
        transportMode: transportMode as 'DRONE' | 'GROUND_ROBOT' | 'AIR_DROP' | 'GROUND_ROVER',
        waypointIndex: i,
        totalWaypoints,
        currentLat: waypoints[i][0],
        currentLng: waypoints[i][1],
        targetLat,
        targetLng,
        etaSeconds: Math.round(eta - (eta * i / totalWaypoints)),
        percentComplete: Math.round((i / (totalWaypoints - 1)) * 100)
      };

      // Validate payload
      DeliveryTelemetryPayloadSchema.parse(payload);

      const reachedEvent = createEvent(
        missionId,
        AgentType.DELIVERY,
        waypointType,
        payload,
        { rationale: `${transportMode} reached waypoint ${i}/${totalWaypoints - 1}.` }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, reachedEvent);
    }

    // 3. After the loop ends, emits ARRIVED
    const arrivedEvent = createEvent(
      missionId,
      AgentType.DELIVERY,
      arrivedType,
      {
        transportMode: transportMode as 'DRONE' | 'GROUND_ROBOT' | 'AIR_DROP' | 'GROUND_ROVER',
        waypointIndex: totalWaypoints - 1,
        totalWaypoints,
        currentLat: targetLat,
        currentLng: targetLng,
        targetLat,
        targetLng,
        etaSeconds: 0,
        percentComplete: 100
      },
      { rationale: `${transportMode} arrived at ${targetZone.name}.` }
    );
    context.agent.sendMessage(AgentType.COORDINATOR, arrivedEvent);

    // Final mission completion is owned by ActionAgent after export/webhook handoff.
    // Delivery stops at arrival so downstream action work cannot be skipped by a race.
  }
}

export const deliveryTool = new Tool({
  name: 'planRoute',
  description: 'Plans a delivery route for a drone to a target zone.',
  inputSchema: DeliveryInputSchema,
  outputSchema: DeliveryOutputSchema,
  run: async ({ missionId, start, end }, context) => {
    await DeliveryAgent.planRoute(missionId, start, end, context);
    return { success: true };
  }
});

export const deliveryAgent = new Agent({
  name: AgentType.DELIVERY,
  description: 'Plans delivery routes and simulates drone flight.',
  tools: [deliveryTool]
});

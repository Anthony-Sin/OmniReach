
import { DeliveryRouteCreatedPayload } from '../types/mission';

export class RoutePlanner {
  static generateRoute(source: { lat: number, lng: number }, destination: { lat: number, lng: number }): Partial<DeliveryRouteCreatedPayload> {
    // Deterministic route generation (linear interpolation for simplicity)
    const waypoints: number[][] = [];
    const steps = 5;
    
    for (let i = 0; i <= steps; i++) {
      const lat = source.lat + (destination.lat - source.lat) * (i / steps);
      const lng = source.lng + (destination.lng - source.lng) * (i / steps);
      waypoints.push([lat, lng]);
    }

    // Fallback route (slightly offset)
    const fallbackWaypoints = waypoints.map(([lat, lng]) => [lat + 0.001, lng + 0.001]);

    return {
      waypoints,
      fallbackWaypoints,
      transportMode: 'DRONE',
      eta: 300, // 5 minutes
      riskFlags: ['Low altitude obstacles', 'Variable wind speeds'],
      constraints: ['Maintain LOS', 'Avoid restricted airspace']
    };
  }
}

import { io } from 'socket.io-client';
import { MissionEvent } from '../types/mission';

// Connect to the server's WebSocket
export const socket = io(window.location.origin);

// Helper to subscribe to mission events
export function subscribeToMissionEvents(callback: (event: MissionEvent) => void) {
  socket.on('mission_event', callback);
  return () => {
    socket.off('mission_event', callback);
  };
}

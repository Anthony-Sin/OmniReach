import { MissionState, MissionProgress } from '../types/mission';

const missions: Map<string, MissionState> = new Map();

export const missionStore = {
  missions,
  
  getActiveMissions() {
    return Array.from(missions.values()).filter(m => 
      m.progress !== MissionProgress.COMPLETED && 
      m.progress !== MissionProgress.FAILED
    );
  },

  getMission(id: string) {
    return missions.get(id);
  },

  setMission(id: string, state: MissionState) {
    missions.set(id, state);
  },

  exportMissions(): string {
    const allMissions = Array.from(missions.values());
    const completedMissions = allMissions.filter(m => 
      m.progress === MissionProgress.COMPLETED || 
      m.progress === MissionProgress.FAILED
    );
    return JSON.stringify(completedMissions, null, 2);
  },

  loadFromExport(json: string): void {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        data.forEach((m: MissionState) => {
          missions.set(m.id, m);
        });
      }
    } catch (e) {
      console.error('Failed to load missions from export:', e);
    }
  },

  clearCompleted(): void {
    const keysToDelete: string[] = [];
    missions.forEach((m, id) => {
      if (m.progress === MissionProgress.COMPLETED || m.progress === MissionProgress.FAILED) {
        keysToDelete.push(id);
      }
    });
    keysToDelete.forEach(id => missions.delete(id));
  },

  addEvent(event: any): void {
    const mission = missions.get(event.missionId);
    if (mission) {
      // Simple deduplication based on event type and payload hash (or just type for unique events)
      const isStatusEvent = ['AGENT_THINKING', 'AGENT_WAITING', 'ROBOT_ARM_STATUS'].includes(event.type);
      
      if (!isStatusEvent) {
        const alreadyHas = mission.events.some(e => e.type === event.type);
        if (alreadyHas) return;
      }

      mission.events.push(event);
      // Update mission data from event payload if applicable
      if (event.payload) {
        mission.data = { ...mission.data, ...event.payload };
      }
      // Update progress if applicable
      if (event.type === 'MISSION_COMPLETE') {
        mission.progress = 'COMPLETED' as any;
      } else if (event.type === 'MISSION_FAILED') {
        mission.progress = 'FAILED' as any;
      }
    }
  },

  getStats() {
    const all = Array.from(missions.values());
    const completed = all.filter(m => m.progress === MissionProgress.COMPLETED).length;
    const failed = all.filter(m => m.progress === MissionProgress.FAILED).length;
    const active = all.filter(m => m.progress !== MissionProgress.COMPLETED && m.progress !== MissionProgress.FAILED).length;
    
    // Count by specialization
    const demand: Record<string, number> = {};
    all.forEach(m => {
      if (m.data.kitSpecialization) {
        const key = m.data.kitSpecialization.replace('_', ' ');
        demand[key] = (demand[key] || 0) + 1;
      }
    });

    // Activity over last 24 hours
    const now = Date.now();
    const activity = Array.from({ length: 24 }, (_, i) => {
      const hourStart = now - (23 - i) * 3600000;
      const hourEnd = hourStart + 3600000;
      const count = all.filter(m => m.data.startTime >= hourStart && m.data.startTime < hourEnd).length;
      return {
        time: new Date(hourStart).getHours() + ':00',
        kits: count,
        drones: count // Simplified: 1 drone per mission
      };
    });

    return { completed, failed, active, demand, activity };
  }
};

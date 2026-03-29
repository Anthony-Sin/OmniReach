/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  AdvancedMarkerAnchorPoint,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { 
  Activity, 
  AlertTriangle, 
  Box, 
  Cpu, 
  Drone, 
  Layers, 
  LayoutDashboard, 
  Map as MapIcon, 
  Navigation, 
  Package, 
  Radio, 
  Settings, 
  ShieldAlert, 
  Zap,
  ChevronRight,
  ChevronLeft,
  Search,
  MousePointer2,
  Plus,
  Info,
  Wind,
  Loader2,
  AlertCircle,
  Factory,
  X,
  CheckCircle2,
  History,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import loadMujoco from 'mujoco-js';
import * as THREE from 'three';
import { MujocoSim } from './src/simulation/MujocoSim';
import { cn } from './lib/utils';
import { MAP_STYLE, INITIAL_ZONES } from './constants';
import { type DisasterZone, type KitRecommendation, type RankedEvent } from './services/geminiService';
import { missionStore } from './src/lib/missionStore';
import { socket, subscribeToMissionEvents } from './src/lib/socket';
import { MissionEvent, MissionState, MissionProgress, NormalizedAlert, MissionCompletePayload, MissionEventType, KitSpecialization } from './src/types/mission';
import { MujocoModule } from './types';
import { MissionTimeline } from './src/components/MissionTimeline';
import { MissionGraph } from './src/components/MissionGraph';
import { MOCK_INVENTORY } from './src/lib/pickPlanner';

declare const google: any;

interface LogOverlayProps {
  log: any;
}

interface VisionDetection {
  item: string;
  confidence: number;
  box_2d: [number, number, number, number];
  source: number[];
  status: 'ACTIVE' | 'QUEUED';
}

/**
 * RealisticItem
 * Removed as requested.
 */
function RealisticItem({ name, quantity }: { name: string, quantity?: number }) {
  return null;
}

/**
 * LogOverlay
 * Draws Gemini detection results (boxes/points) over an image.
 * Uses a normalized 1000x1000 coordinate system.
 */
export function LogOverlay({ log }: LogOverlayProps) {
  if (!log.result || !Array.isArray(log.result)) return null;
  
  const results = log.result as any[];
  const shapes = results.map((item, idx) => {
    if (item.box_2d) {
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      return (
        <rect 
          key={idx} x={xmin} y={ymin} width={xmax - xmin} height={ymax - ymin} 
          fill="rgba(79, 70, 229, 0.15)" stroke="#4f46e5" strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      );
    } else if (item.point) {
      const [y, x] = item.point;
      return <circle key={idx} cx={x} cy={y} r="10" fill="#4f46e5" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />;
    }
    return null;
  });

  return (
    <svg 
      viewBox="0 0 1000 1000" 
      preserveAspectRatio="none" 
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
    >
      {shapes}
    </svg>
  );
}

function formatProgressLabel(progress?: string | null) {
  if (!progress) return 'Idle';
  return progress.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function toPreviewPoint(source: number[]) {
  const x = Math.max(80, Math.min(920, 140 + ((source[0] - 0.3) / 0.5) * 720));
  const y = Math.max(80, Math.min(920, 120 + ((source[1] + 0.4) / 0.8) * 760));
  return { x, y };
}

function buildVisionDetections(pickSequence?: any[], fallbackItems?: string[]): VisionDetection[] {
  const pickedItems = (pickSequence ?? [])
    .filter(step => step.action === 'PICK' && step.item && step.item !== 'ARM' && step.item !== 'COMPLETE_KIT')
    .map(step => ({ item: step.item, source: step.source }));

  const seedItems = pickedItems.length > 0
    ? pickedItems
    : (fallbackItems ?? []).slice(0, 6).map(item => ({
        item,
        source: MOCK_INVENTORY[item]?.location ?? [0.4, 0, 0.1]
      }));

  return seedItems.slice(0, 6).map((entry, index) => {
    const point = toPreviewPoint(entry.source);
    const halfWidth = 58;
    const halfHeight = 42;
    return {
      item: entry.item,
      confidence: Math.max(0.82, 0.97 - index * 0.02),
      source: entry.source,
      status: index === 0 ? 'ACTIVE' : 'QUEUED',
      box_2d: [
        Math.max(0, point.y - halfHeight),
        Math.max(0, point.x - halfWidth),
        Math.min(1000, point.y + halfHeight),
        Math.min(1000, point.x + halfWidth)
      ]
    };
  });
}

export function App() {
  // Aegis UI State
  const [selectedZone, setSelectedZone] = useState<DisasterZone | null>(null);
  const [zones, setZones] = useState<DisasterZone[]>(INITIAL_ZONES as DisasterZone[]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([]);
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [currentMission, setCurrentMission] = useState<MissionState | null>(null);
  const [missionSummary, setMissionSummary] = useState<MissionCompletePayload | null>(null);
  const [dronePositions, setDronePositions] = useState<Map<string, { lat: number; lng: number; percent: number }>>(new Map());
  const [viewMode, setViewMode] = useState<'logs' | 'graph'>('logs');
  const [supplyLevel, setSupplyLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [stock, setStock] = useState<any[]>([]);
  const [roboticsSnapshot, setRoboticsSnapshot] = useState<string | null>(null);

  const fetchStock = async () => {
    try {
      const response = await fetch('/api/inventory/stock');
      if (response.ok) {
        const data = await response.json();
        setStock(data);
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error);
    }
  };

  const updateSupplyLevel = async (level: 'low' | 'medium' | 'high') => {
    try {
      const response = await fetch('/api/inventory/supply-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      if (response.ok) {
        setSupplyLevel(level);
        fetchStock();
      }
    } catch (error) {
      console.error('Failed to update supply level:', error);
    }
  };

  // MuJoCo State
  const containerRef = useRef<HTMLDivElement>(null); 
  const simRef = useRef<MujocoSim | null>(null);      
  const isMounted = useRef(true);                     
  const mujocoModuleRef = useRef<MujocoModule | null>(null);          

  const [simLoading, setSimLoading] = useState(false);
  const [simStatus, setSimStatus] = useState("");
  const [simError, setSimError] = useState<string | null>(null);
  const [mujocoReady, setMujocoReady] = useState(false); 

  const [googleReady, setGoogleReady] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [isRobotFullscreen, setIsRobotFullscreen] = useState(false);
  const [simBootNonce, setSimBootNonce] = useState(0);

  const selectedZoneKey = selectedZone
    ? `${selectedZone.id}:${selectedZone.type}:${selectedZone.lat}:${selectedZone.lng}`
    : null;

  const openRobotFullscreen = () => {
    if (selectedZone?.type === 'facility') {
      setIsRobotFullscreen(true);
    }
  };

  const retrySimulationBoot = () => {
    setSimError(null);
    setSimBootNonce(prev => prev + 1);
  };

  const hasMissionActivity = Boolean(currentMissionId || currentMission || missionSummary || missionEvents.length);
  const latestThinkingEvents = useMemo(
    () => missionEvents.filter(event => event.type === MissionEventType.AGENT_THINKING || event.type === MissionEventType.AGENT_WAITING).slice(0, 4),
    [missionEvents]
  );
  const roboticsDetections = useMemo(
    () => buildVisionDetections(currentMission?.data.pickSequence, currentMission?.data.recommendation?.items),
    [currentMission?.data.pickSequence, currentMission?.data.recommendation?.items]
  );
  const roboticsVisionLog = useMemo(
    () => roboticsDetections.length > 0 ? {
      model: 'Gemini Robotics-ER 1.5',
      summary: `${roboticsDetections.length} workspace targets identified for robotic handling.`,
      result: roboticsDetections.map(detection => ({
        label: detection.item,
        confidence: Number(detection.confidence.toFixed(2)),
        status: detection.status,
        source: detection.source,
        box_2d: detection.box_2d
      }))
    } : null,
    [roboticsDetections]
  );
  const miniMapSteps = useMemo(
    () => (currentMission?.data.pickSequence ?? []).filter(step => step.action === 'PICK').slice(0, 5),
    [currentMission?.data.pickSequence]
  );

  useEffect(() => {
    const checkGoogle = setInterval(() => {
      if ((window as any).google && (window as any).google.maps) {
        setGoogleReady(true);
        clearInterval(checkGoogle);
      }
    }, 100);
    return () => clearInterval(checkGoogle);
  }, []);

  const syncMissionState = (mission: MissionState) => {
    missionStore.setMission(mission.id, mission);

    if (mission.id === currentMissionId) {
      setCurrentMission(mission);
      setMissionEvents([...mission.events].reverse().slice(0, 100));

      if (mission.data.rankedEvents) {
        const newZones: DisasterZone[] = mission.data.rankedEvents.map((re: any) => {
          let severity: any = 'medium';
          const alertLevel = re.alertLevel || re.alertlevel;
          if (alertLevel === 'red') severity = 'critical';
          else if (alertLevel === 'orange') severity = 'high';
          else if (alertLevel === 'green') severity = 'low';

          const gdacsType = (re.eventtype || 'flood').toLowerCase();
          let mappedType: any = 'flood';
          if (gdacsType.includes('flood')) mappedType = 'flood';
          else if (gdacsType.includes('earthquake')) mappedType = 'earthquake';
          else if (gdacsType.includes('wildfire')) mappedType = 'wildfire';
          else if (gdacsType.includes('cyclone') || gdacsType.includes('hurricane') || gdacsType.includes('typhoon')) mappedType = 'hurricane';

          return {
            id: `gdacs-${re.eventid}`,
            name: re.name,
            type: mappedType,
            severity,
            lat: re.lat,
            lng: re.lng,
            description: re.reasoning || re.description,
            waypoints: re.waypoints
          };
        });
        setZones(prev => {
          const facility = prev.find(z => z.type === 'facility');
          return facility ? [facility, ...newZones] : newZones;
        });
      }

      if (mission.data.selectedZone) {
        const nextZone = mission.data.selectedZone as DisasterZone;
        setSelectedZone(prev => {
          if (
            prev &&
            prev.id === nextZone.id &&
            prev.type === nextZone.type &&
            prev.lat === nextZone.lat &&
            prev.lng === nextZone.lng
          ) {
            return prev;
          }
          return nextZone;
        });
      }
    }
  };

  // Agent Event System Integration
  useEffect(() => {
    fetchStock();
    // Subscribe to mission events via WebSocket
    const unsubscribe = subscribeToMissionEvents((event: MissionEvent) => {
      if (event.type === MissionEventType.MISSION_COMPLETE) {
        setMissionSummary(event.payload);
        fetchStock();
        
        // Remove drone marker after 3 seconds
        setTimeout(() => {
          setDronePositions(prev => {
            const next = new Map(prev);
            next.delete(event.missionId);
            return next;
          });
        }, 3000);
      }

      // Track drone positions
      if (
        event.type === MissionEventType.DELIVERY_DISPATCHED || 
        event.type === MissionEventType.DELIVERY_WAYPOINT_REACHED || 
        event.type === MissionEventType.DELIVERY_ARRIVED
      ) {
        setDronePositions(prev => {
          const next = new Map(prev);
          next.set(event.missionId, {
            lat: event.payload.currentLat,
            lng: event.payload.currentLng,
            percent: event.payload.percentComplete
          });
          return next;
        });
      }
    });

    // Handle initial mission state broadcast
    const handleMissionInit = (mission: MissionState) => {
      syncMissionState(mission);
    };

    const handleMissionState = (mission: MissionState) => {
      syncMissionState(mission);
    };

    socket.on('mission_init', handleMissionInit);
    socket.on('mission_state', handleMissionState);

    return () => {
      unsubscribe();
      socket.off('mission_init', handleMissionInit);
      socket.off('mission_state', handleMissionState);
    };
  }, [currentMissionId]);

  const handleStartMission = async () => {
    setMissionSummary(null);
    try {
      const response = await fetch('/api/missions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: selectedZone })
      });
      const { missionId } = await response.json();
      setCurrentMissionId(missionId);
    } catch (err) {
      console.error('Failed to start mission:', err);
    }
  };

  useEffect(() => {
    if (!currentMissionId) return;
    const mission = missionStore.getMission(currentMissionId);
    if (mission) {
      syncMissionState(mission);
    }
  }, [currentMissionId]);

  // Handle simulation resize when panels toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (simRef.current) {
        simRef.current.renderSys.onResize();
      }
    }, 350); // Wait for transition to finish
    return () => clearTimeout(timer);
  }, [sidebarOpen, rightPanelOpen]);

  // Booting logs effect
  useEffect(() => {
    if (isBooting) {
      const logs = [
        "INITIALIZING AEGIS CORE...",
        "CONNECTING TO FRANKA PANDA...",
        "CALIBRATING SPATIAL SENSORS...",
        "LOADING MUJOCO WASM...",
        "SYNCHRONIZING TELEMETRY...",
        "AEGIS COMMAND ONLINE."
      ];
      setBootLogs([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setBootLogs(prev => [...prev, logs[i]]);
          i++;
        } else {
          // Keep showing the last few logs but allow new ones from sim status
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isBooting]);

  // Initialize MuJoCo Module
  useEffect(() => {
    isMounted.current = true;
    loadMujoco({
      locateFile: (path: string) => path.endsWith('.wasm') ? "https://unpkg.com/mujoco-js@0.0.7/dist/mujoco_wasm.wasm" : path,
      printErr: (text: string) => { 
        if (text.includes("Aborted") && isMounted.current) {
            setSimError(prev => prev ? prev : "Simulation crashed. Reload page."); 
        }
      }
    }).then((inst: unknown) => { 
      if (isMounted.current) { 
        mujocoModuleRef.current = inst as MujocoModule; 
        setMujocoReady(true); 
      } 
    }).catch((err: Error) => { 
      if (isMounted.current) { 
        setSimError(err.message || "Failed to init spatial simulation"); 
      } 
    });
    return () => { isMounted.current = false; simRef.current?.dispose(); };
  }, []);

  // Initialize Simulation when a zone is selected
  useEffect(() => {
      if (!mujocoReady || !selectedZone || !containerRef.current || !mujocoModuleRef.current) return;

      setSimLoading(true); 
      setIsBooting(true);
      setSimError(null); 
      
      simRef.current?.dispose();
      
      // Small delay to ensure container has dimensions
      const timer = setTimeout(() => {
        if (!containerRef.current) return;
        try {
            simRef.current = new MujocoSim(containerRef.current, mujocoModuleRef.current);
            simRef.current.renderSys.setDarkMode(true);
            
            // Determine which model to load
            const modelId = selectedZone.type === 'facility' ? 'franka_emika_panda' : 'franka_panda_stack';
            const disasterType = selectedZone.type === 'facility' ? 'flood' : selectedZone.type;
            
            simRef.current.init(modelId, "scene.xml", disasterType, supplyLevel, (msg) => {
               if (isMounted.current) {
                 setSimStatus(msg);
                 setBootLogs(prev => [...prev.slice(-5), msg]);
               }
            })
               .then(() => {
                   if (isMounted.current) {
                       simRef.current?.setIkEnabled(false);
                       setSimLoading(false);
                       if (selectedZone.type !== 'facility') {
                           setTimeout(() => setIsBooting(false), 1000);
                       } else {
                           setSimLoading(false);
                           setIsBooting(false);
                       }
                   }
               })
               .catch(err => { 
                   if (isMounted.current) { 
                       console.error("Sim Init Error:", err);
                       setSimError(err.message); 
                       setSimLoading(false); 
                       setIsBooting(false);
                   } 
               });
               
        } catch (err: unknown) { 
            if (isMounted.current) { 
                console.error("Sim Catch Error:", err);
                setSimError((err as Error).message); 
                setSimLoading(false); 
                setIsBooting(false);
            } 
        }
      }, 300);

      return () => clearTimeout(timer);
  }, [mujocoReady, selectedZoneKey, supplyLevel, simBootNonce]);

  // Handle robotics execution sequence triggered by Coordinator
  useEffect(() => {
    if (currentMission?.data.executionStatus === 'EXECUTING' && simRef.current) {
        const waypoints = currentMission.data.recommendation?.waypoints;
        const pickSequence = currentMission.data.pickSequence;
        
        if (waypoints || pickSequence) {
          setIsBooting(true);
          setBootLogs(prev => [...prev, "> Coordinator: Execution Command Received", "> Initiating robotic assembly sequence..."]);
          
          const onFinished = () => {
            if (!currentMission.data.assignedArmId) {
              console.error('Simulation finished but no assigned arm id was present for completion.');
              if (isMounted.current) setIsBooting(false);
              return;
            }
            console.log("Simulation finished, emitting robotics_complete");
            socket.emit('robotics_complete', { 
              missionId: currentMission.id,
              armId: currentMission.data.assignedArmId
            });
            if (isMounted.current) setIsBooting(false);
          };

          if (pickSequence) {
            const sources = pickSequence.map((s: any) => new THREE.Vector3(...s.source));
            const targets = pickSequence.map((s: any) => new THREE.Vector3(...s.target));
            const markerIds = pickSequence.map((_: any, i: number) => i);
            simRef.current.pickupItems(sources, markerIds, onFinished, targets);
          } else if (waypoints) {
            simRef.current.startSequence(waypoints as [number, number, number][], onFinished);
          }
        }
    }
  }, [currentMission?.data.executionStatus]);

  // Handle resize when entering/exiting fullscreen
  useEffect(() => {
    if (simRef.current) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        if (simRef.current) {
          simRef.current.renderSys.onResize();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isRobotFullscreen]);

  useEffect(() => {
    const shouldCapture = Boolean(simRef.current && selectedZone && (currentMission?.data.recommendation || currentMission?.data.pickSequence));
    if (!shouldCapture) {
      setRoboticsSnapshot(null);
      return;
    }

    const captureSnapshot = () => {
      try {
        const snapshot = simRef.current?.renderSys.getCanvasSnapshot(960, 540, 'image/jpeg');
        if (snapshot) {
          setRoboticsSnapshot(snapshot);
        }
      } catch (error) {
        console.warn('Failed to capture robotics snapshot:', error);
      }
    };

    captureSnapshot();
    const interval = window.setInterval(captureSnapshot, currentMission?.data.executionStatus === 'EXECUTING' ? 1200 : 2500);
    return () => window.clearInterval(interval);
  }, [currentMission?.id, currentMission?.data.executionStatus, currentMission?.data.recommendation, currentMission?.data.pickSequence, selectedZoneKey, isRobotFullscreen]);

  const handleMapClick = (e: any) => {
    if (e.detail.latLng) {
      const newZone: DisasterZone = {
        id: Math.random().toString(36).substr(2, 9),
        name: `New Incident ${zones.length + 1}`,
        type: 'flood',
        severity: 'medium',
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
        description: 'Newly reported incident. Awaiting AI assessment.'
      };
      setZones([...zones, newZone]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden selection:bg-cyan-500/30 font-sans">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 h-12 glass-panel border-b border-white/10 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span className="font-bold tracking-tighter text-lg uppercase">Aegis Command</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMissionActivity && (
            <>
              <button 
                onClick={() => {
                  const data = missionStore.exportMissions();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `aegis-mission-report-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                title="Download Mission Report"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Report</span>
              </button>
              
              <button 
                onClick={() => {
                  if (window.confirm('Clear all completed missions from history?')) {
                    missionStore.clearCompleted();
                    setMissionEvents([]);
                    setMissionSummary(null);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                title="Clear Completed Missions"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear History</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Left Sidebar - Layers/Legend */}
      <aside 
        className={cn(
          "absolute left-0 top-12 bottom-0 glass-panel border-r border-white/10 transition-all duration-300",
          isRobotFullscreen ? "z-[110]" : "z-40",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex border-b border-white/10 bg-cyan-500/5">
            <div className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-cyan-400 text-center border-b-2 border-cyan-400">
              Discourse
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-2 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                System Controls
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/40">System State</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      "inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest",
                      missionSummary ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300" :
                      currentMission ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300" :
                      "border-white/10 bg-white/5 text-white/40"
                    )}>
                      {missionSummary ? 'Mission Complete' : currentMission ? formatProgressLabel(currentMission.progress) : 'Standby'}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-white/55">
                    Agent: <span className="font-bold text-white/80">{currentMission?.currentStep ?? 'COORDINATOR'}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/40">Supply Profile</div>
                  <div className="mt-3 flex gap-1">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => updateSupplyLevel(level)}
                        className={cn(
                          "flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all border",
                          supplyLevel === level
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  Assembly Mini-Map
                </div>
                <span className="text-[8px] uppercase tracking-[0.2em] text-white/30">
                  {currentMission?.data.executionStatus ?? 'STANDBY'}
                </span>
              </div>
              <MiniArmOverview detections={roboticsDetections} currentStep={currentMission?.currentStep} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                  {missionSummary && viewMode === 'graph' ? 'Mission Flow' : 'Discourse'}
                </div>
                <div className="flex items-center gap-2">
                  {missionSummary && (
                    <button 
                      onClick={() => setViewMode(viewMode === 'logs' ? 'graph' : 'logs')}
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/60 hover:bg-white/10"
                    >
                      {viewMode === 'logs' ? 'VIEW FLOW' : 'VIEW LOGS'}
                    </button>
                  )}
                  <button 
                    onClick={handleStartMission}
                    className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 rounded text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/30 flex items-center gap-1 shadow-[0_0_18px_rgba(0,242,255,0.14)]"
                  >
                    <Zap className="w-3 h-3" />
                    START AEGIS MISSION
                  </button>
                </div>
              </div>

              {currentMission && (
                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <MissionTimeline 
                    progress={currentMission.progress} 
                    currentStep={currentMission.currentStep} 
                  />
                </div>
              )}

              {latestThinkingEvents.length > 0 && (
                <div className="grid gap-2">
                  {latestThinkingEvents.map(event => (
                    <div key={event.traceId} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{event.sourceAgent}</span>
                        <span className="text-[8px] text-white/30">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-white/80">
                        {(event.payload as any)?.message ?? event.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {missionSummary && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-cyan-400 text-black rounded-lg space-y-3 shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest">Mission Complete</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium leading-tight">
                    {missionSummary.summary}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10">
                    <div className="text-center">
                      <div className="text-[8px] uppercase font-bold opacity-60">Accuracy</div>
                      <div className="text-xs font-black">{(missionSummary.successMetrics.accuracy * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] uppercase font-bold opacity-60">Speed</div>
                      <div className="text-xs font-black">{(missionSummary.successMetrics.speed * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] uppercase font-bold opacity-60">Safety</div>
                      <div className="text-xs font-black">{(missionSummary.successMetrics.safety * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-[8px] font-bold uppercase opacity-40 text-center pt-1">
                    Duration: {Math.floor((missionSummary.timestamps.end - missionSummary.timestamps.start) / 1000)}s
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-2 custom-scrollbar">
                {missionEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 text-center">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/25">Operator Console Idle</div>
                    <div className="mt-3 text-sm font-semibold text-white/70">Select a zone and launch a trial run.</div>
                    <div className="mt-2 text-[11px] text-white/35">Live agent cognition, mission flow, and robotic telemetry will appear here.</div>
                  </div>
                ) : missionSummary && viewMode === 'graph' ? (
                  <MissionGraph events={missionEvents} />
                ) : (
                  missionEvents.map((event) => (
                    <div key={event.traceId} className={cn(
                      "space-y-1 rounded-xl border p-3",
                      event.status === 'ERROR'
                        ? "border-red-500/30 bg-red-500/5"
                        : event.type === MissionEventType.AGENT_THINKING
                        ? "border-cyan-500/25 bg-cyan-500/8"
                        : "border-white/10 bg-white/5"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">{event.sourceAgent}</span>
                        <span className="text-[8px] text-white/20">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-tighter text-white/60">
                        {event.type}
                      </div>
                      {event.errors && event.errors.length > 0 && (
                        <div className="space-y-1">
                          {event.errors.map((err, i) => (
                            <p key={i} className="text-[10px] text-red-400 italic">
                              Error: {err}
                            </p>
                          ))}
                        </div>
                      )}
                      {event.rationale && (
                        <p className="text-[9px] text-white/50 leading-tight">
                          {event.rationale}
                        </p>
                      )}
                      <div className="text-[8px] text-white/30 uppercase tracking-tighter">
                        Mission: {event.missionId.substr(-6)} | Trace: {event.traceId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-6 h-12 glass-panel border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all",
          isRobotFullscreen ? "z-[111]" : "z-50",
          sidebarOpen ? "left-80" : "left-0"
        )}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main Map Content */}
      <main className="flex-1 relative">
        {/* MuJoCo Container at Root Level */}
        <div 
          ref={containerRef} 
          className={cn(
            "fixed inset-0 z-[100] bg-black overflow-hidden cursor-zoom-out transition-all duration-500",
            isRobotFullscreen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onDoubleClick={() => {
            setIsRobotFullscreen(false);
          }}
        >
          {/* HUD Elements */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-transparent border-t-white/5 border-b-white/5 flex flex-col justify-between p-12">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="w-48 h-px bg-gradient-to-r from-cyan-400 to-transparent" />
                <div className="font-mono text-[10px] text-cyan-400/60 space-y-1">
                  <div>SENSORS: NOMINAL</div>
                  <div>TORQUE: 45.2 Nm</div>
                  <div>TEMP: 34.2°C</div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="w-48 h-px bg-gradient-to-l from-cyan-400 to-transparent ml-auto" />
                <div className="font-mono text-[10px] text-cyan-400/60">
                  MISSION: {selectedZone?.name || 'STANDBY'}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="px-8 py-4 glass-panel border border-cyan-500/20 rounded flex items-center gap-8">
                 <div className="flex flex-col items-center">
                    <span className="text-[8px] text-white/20 uppercase mb-1">X-Axis</span>
                    <span className="text-xs font-mono text-cyan-400">0.452</span>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="flex flex-col items-center">
                    <span className="text-[8px] text-white/20 uppercase mb-1">Y-Axis</span>
                    <span className="text-xs font-mono text-cyan-400">-0.128</span>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="flex flex-col items-center">
                    <span className="text-[8px] text-white/20 uppercase mb-1">Z-Axis</span>
                    <span className="text-xs font-mono text-cyan-400">0.891</span>
                 </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsRobotFullscreen(false);
            }}
            className="absolute top-6 right-6 z-[120] p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
          >
            <X className="w-5 h-5 text-white/40 group-hover:text-white" />
          </button>

          {(simLoading || isBooting || simError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-[110] p-6 text-center">
              {simError ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 max-w-md"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                    <AlertTriangle className="w-16 h-16 text-red-500 relative z-10 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-red-500">System Failure</h3>
                    <p className="text-xs font-mono text-white/60 leading-relaxed">
                      {simError.includes("memory access out of bounds") 
                        ? "CRITICAL: MuJoCo WASM Memory Corruption. This usually indicates a malformed XML model or resource exhaustion."
                        : simError}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-red-500/20 border border-red-500/50 rounded text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Hard Reset
                    </button>
                    <button 
                      onClick={retrySimulationBoot}
                      className="px-6 py-2 bg-white/5 border border-white/10 rounded text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
                    >
                      Retry Boot
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 text-cyan-400 animate-spin relative z-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="w-full max-w-[240px] space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-cyan-400/60 uppercase tracking-widest">
                        <span>System Boot</span>
                        <span>{isBooting ? "Active" : "Ready"}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.6)]"
                        />
                      </div>
                    </div>

                    <div className="font-mono text-[9px] text-cyan-400/40 space-y-0.5 h-20 overflow-hidden text-left">
                      <AnimatePresence mode="popLayout">
                        {bootLogs.map((log, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2"
                          >
                            <span className="text-cyan-400/20">[{idx.toString().padStart(2, '0')}]</span>
                            <span className="truncate">{log}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'undefined' ? process.env.GOOGLE_MAPS_API_KEY : ''}>
          {(!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'undefined') && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
              <div className="max-w-md space-y-4">
                <MapIcon className="w-12 h-12 text-cyan-500 mx-auto" />
                <h3 className="text-lg font-bold uppercase tracking-tighter text-cyan-400">Map Configuration Required</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  The Google Maps API key is missing or invalid. Please provide a valid key in the application settings to enable global disaster monitoring.
                </p>
                <div className="p-3 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white/40 text-left">
                  1. Open Settings Menu<br />
                  2. Add GOOGLE_MAPS_API_KEY<br />
                  3. Refresh Application
                </div>
              </div>
            </div>
          )}
          <GoogleMap
            defaultCenter={{ lat: 25.2048, lng: 55.2708 }}
            defaultZoom={12}
            disableDefaultUI={true}
            disableDoubleClickZoom={true}
            onClick={handleMapClick}
            mapId="DEMO_MAP_ID"
          >
            {zones.map((zone) => (
              <AdvancedMarker
                key={zone.id}
                position={{ lat: zone.lat, lng: zone.lng }}
                anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
                onClick={() => setSelectedZone(zone)}
              >
                <div 
                  onDoubleClick={() => {
                    if (zone.type === 'facility') {
                      setSelectedZone(zone);
                      setRightPanelOpen(true);
                      setIsRobotFullscreen(true);
                    }
                  }}
                  className="flex h-[60px] w-[60px] items-center justify-center cursor-pointer group"
                >
                  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id={`glow-${zone.id}`} x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id={`grad-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    
                    <circle cx="50" cy="50" r="45" fill={zone.type === 'facility' ? '#a855f7' : zone.severity === 'critical' ? '#ef4444' : zone.severity === 'high' ? '#f97316' : '#06b6d4'} fillOpacity="0.05" />
                    
                    <g filter={`url(#glow-${zone.id})`}>
                      <path d="M50 10L80 27.32V62.68L50 80L20 62.68V27.32L50 10Z" fill={zone.type === 'facility' ? '#a855f7' : zone.severity === 'critical' ? '#ef4444' : zone.severity === 'high' ? '#f97316' : '#06b6d4'} fillOpacity="0.2" stroke={zone.type === 'facility' ? '#a855f7' : zone.severity === 'critical' ? '#ef4444' : zone.severity === 'high' ? '#f97316' : '#06b6d4'} strokeWidth="2.5"/>
                      <path d="M50 20L72 32.7V57.3L50 70L28 57.3V32.7L50 20Z" stroke={zone.type === 'facility' ? '#a855f7' : zone.severity === 'critical' ? '#ef4444' : zone.severity === 'high' ? '#f97316' : '#06b6d4'} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6"/>
                    </g>

                    {zone.type === 'facility' ? (
                      <>
                        <g transform="translate(35, 35) scale(0.6)">
                          <path d="M10 40V20L25 10L40 20V40H10Z" fill={`url(#grad-${zone.id})`} />
                          <rect x="22" y="30" width="6" height="10" fill="#a855f7" />
                          <path d="M5 45H45" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </g>
                        <circle cx="50" cy="50" r="20" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.6">
                          <animate attributeName="r" from="20" to="45" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      </>
                    ) : (
                      <g transform="translate(35, 35) scale(0.6)">
                        <path d="M25 10L40 25L25 40L10 25L25 10Z" fill={zone.severity === 'critical' ? '#ef4444' : zone.severity === 'high' ? '#f97316' : '#06b6d4'} fillOpacity="0.6" />
                        <circle cx="25" cy="25" r="5" fill="white" />
                      </g>
                    )}
                  </svg>
                </div>
              </AdvancedMarker>
            ))}

            {/* Drone Markers */}
            {Array.from(dronePositions.entries()).map(([missionId, pos]) => (
              <AdvancedMarker
                key={missionId}
                position={{ lat: pos.lat, lng: pos.lng }}
                anchorPoint={['50%', '28%']}
              >
                <div className="relative h-12 w-24 pointer-events-none">
                  <div className="absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full bg-[#EF9F27] border-2 border-[#BA7517] shadow-[0_0_10px_rgba(239,159,39,0.5)]" />
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 px-2 py-0.5 bg-black/80 border border-white/10 rounded text-[8px] font-bold text-white whitespace-nowrap shadow-lg">
                    {pos.percent === 100 ? 'Arrived' : `${pos.percent}% - en route`}
                  </div>
                </div>
              </AdvancedMarker>
            ))}
          </GoogleMap>
        </APIProvider>

        {/* Map Overlays */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 z-30">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30">
            <Activity className="w-3 h-3 text-cyan-400" />
            System Status: Nominal
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-white/10">
            <Cpu className="w-3 h-3 text-purple-400" />
            Assembly Arm: Active
          </div>
        </div>
    </main>

      {/* Right Panel - Selection Details */}
      <aside 
        className={cn(
          "absolute right-0 top-12 bottom-0 glass-panel border-l border-white/10 z-40 transition-all duration-300",
          rightPanelOpen ? "w-96" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
          {selectedZone ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div 
                    onDoubleClick={openRobotFullscreen}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors",
                      selectedZone.type === 'facility' ? "bg-purple-500/10 border-purple-500/30" : "bg-cyan-500/10 border-cyan-500/30"
                    )}
                  >
                    {selectedZone.type === 'facility' ? <Factory className="w-6 h-6 text-purple-400" /> : <AlertTriangle className="w-6 h-6 text-cyan-400" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tighter uppercase">{selectedZone.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                        selectedZone.severity === 'critical' ? "bg-red-500/20 text-red-400 border border-red-500/50" :
                        selectedZone.severity === 'high' ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" :
                        selectedZone.severity === 'nominal' ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" :
                        "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      )}>
                        {selectedZone.severity} Severity
                      </span>
                      <span className="text-[10px] text-white/40 uppercase">{selectedZone.type}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedZone(null)} className="text-white/40 hover:text-white">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded border border-white/10">
                  <div className="text-[10px] text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Situation Assessment
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {selectedZone.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleStartMission}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Deploy AEGIS Response
                  </button>

                  {/* Autonomous kit assignments */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Autonomous kit assignments</div>
                    <div className="flex flex-wrap gap-2">
                      {missionStore.getActiveMissions()
                        .filter(m => 
                          (m.data.selectedZone?.id === selectedZone.id || m.data.selectedZone?.name === selectedZone.name) &&
                          m.data.kitSpecialization
                        )
                        .map((m, i) => (
                          <span 
                            key={i} 
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold uppercase border",
                              m.data.kitSpecialization === KitSpecialization.SEARCH_RESCUE ? "bg-red-500/20 text-red-400 border-red-500/50" :
                              m.data.kitSpecialization === KitSpecialization.MEDICAL ? "bg-orange-500/20 text-orange-400 border-orange-500/50" :
                              m.data.kitSpecialization === KitSpecialization.WATER_SANITATION ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" :
                              "bg-purple-500/20 text-purple-400 border-purple-500/50"
                            )}
                          >
                            {m.data.kitSpecialization?.replace('_', ' ')}
                          </span>
                        ))}
                      {missionStore.getActiveMissions().filter(m => 
                        (m.data.selectedZone?.id === selectedZone.id || m.data.selectedZone?.name === selectedZone.name) &&
                        m.data.kitSpecialization
                      ).length === 0 && (
                        <span className="text-[9px] text-white/20 uppercase italic">No active assignments</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] text-white/40 uppercase font-bold flex items-center justify-between">
                    <span>AI Intervention Strategy</span>
                    {currentMission && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black tracking-[0.25em] text-cyan-300">
                        <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                        {formatProgressLabel(currentMission.progress)}
                      </span>
                    )}
                  </div>

                  {!currentMission ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
                          <Cpu className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Waiting For Mission Start
                          </div>
                          <p className="text-xs leading-relaxed text-white/45">
                            Select an incident and launch AEGIS to see live agent reasoning, robotics vision output, and delivery orchestration appear here.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                              Agent Reasoning
                            </div>
                            <div className="mt-1 text-xs text-white/55">
                              Live chain-of-action from coordinator, planning, robotics, and delivery agents.
                            </div>
                          </div>
                          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.24em] text-cyan-300">
                            {currentMission.currentStep ?? 'COORDINATOR'}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2">
                          {(latestThinkingEvents.length > 0 ? latestThinkingEvents : missionEvents.slice(0, 3)).map(event => (
                            <div key={event.traceId} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
                                  {event.sourceAgent}
                                </span>
                                <span className="text-[8px] text-white/30">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] leading-relaxed text-white/80">
                                {(event.payload as any)?.message ?? event.rationale ?? event.type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">
                              Assembly Arm Feed
                            </div>
                            <div className="mt-1 text-[11px] text-white/40">
                              Live workspace snapshot with Gemini Robotics-ER 1.5 detections.
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.24em]",
                              currentMission.data.executionStatus === 'EXECUTING'
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                            )}>
                              {currentMission.data.executionStatus ?? 'READY'}
                            </span>
                            <button
                              onClick={() => setIsRobotFullscreen(true)}
                              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/60 hover:bg-white/10"
                            >
                              Expand
                            </button>
                          </div>
                        </div>

                        <div
                          className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-inner cursor-zoom-in"
                          onClick={() => setIsRobotFullscreen(true)}
                        >
                          {roboticsSnapshot ? (
                            <>
                              <img
                                src={roboticsSnapshot}
                                alt="Robotic assembly workspace"
                                className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
                              />
                              {roboticsVisionLog && <LogOverlay log={roboticsVisionLog} />}
                              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/65 via-black/20 to-transparent" />
                              <div className="absolute left-3 top-3 rounded-lg border border-cyan-500/20 bg-black/55 px-3 py-2 backdrop-blur-sm">
                                <div className="text-[8px] font-black uppercase tracking-[0.24em] text-cyan-300">
                                  Gemini Robotics-ER 1.5
                                </div>
                                <div className="mt-1 text-[10px] text-white/65">
                                  {roboticsVisionLog?.summary}
                                </div>
                              </div>
                              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                                <motion.div
                                  initial={{ y: '-100%' }}
                                  animate={{ y: '100%' }}
                                  transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                                  className="h-1/2 w-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                              <Loader2 className="h-5 w-5 animate-spin text-cyan-400/70" />
                              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                                Waiting For Arm Snapshot
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="space-y-3">
                          <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Active Recommendation</div>
                          {currentMission.data.recommendation ? (
                            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-4">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                    {currentMission.data.recommendation.kitType}
                                  </div>
                                  <div className="mt-1 text-xs leading-tight text-white/60">
                                    {currentMission.data.recommendation.reasoning}
                                  </div>
                                </div>
                                <div className={cn(
                                  "text-[8px] px-1.5 py-0.5 rounded uppercase font-bold",
                                  currentMission.data.recommendation.priority === 'critical' ? "bg-red-500 text-white" : "bg-cyan-500 text-black"
                                )}>
                                  {currentMission.data.recommendation.priority}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-[8px] text-white/40 uppercase font-bold flex items-center justify-between">
                                  <span>Assembly Queue</span>
                                  <span className="text-[7px] opacity-40">AEGIS-CERTIFIED ASSETS</span>
                                </div>
                                <div className="flex flex-wrap gap-2 py-1">
                                  {currentMission.data.recommendation.items.map((item: string, i: number) => (
                                    <div key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-tight">
                                        {item.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45">
                              Strategy generation is in progress. Recommendation details will appear as soon as planning completes.
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Vision Response</div>
                          <div className="rounded-xl border border-white/10 bg-[#071017] p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-[0.24em] text-cyan-300">
                                Gemini Robotics JSON
                              </span>
                              <span className="text-[8px] text-white/35">
                                {roboticsDetections.length} detections
                              </span>
                            </div>
                            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/35 p-3 text-[10px] leading-relaxed text-cyan-100/85">
{JSON.stringify(roboticsVisionLog ?? {
  model: 'Gemini Robotics-ER 1.5',
  summary: 'Awaiting structured perception response.',
  result: []
}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Last-Mile Coordinator</div>
                        {currentMission?.data.route ? (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Drone className="w-4 h-4 text-cyan-400" />
                                <span className="text-[10px] font-bold uppercase">{currentMission.data.route.transportMode}</span>
                              </div>
                              <div className="text-[10px] font-bold text-cyan-400">ETA: {currentMission.data.route.eta}m</div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] text-white/60 leading-tight italic">
                                "{currentMission.data.route.routeNarrative}"
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {currentMission.data.route.riskFlags.map((flag: string, i: number) => (
                                  <span key={i} className="text-[8px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded uppercase">
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: currentMission.data.route.eta, ease: "linear" }}
                                className="h-full bg-cyan-400"
                              />
                            </div>
                          </motion.div>
                        ) : (
                          <div className="space-y-3 opacity-55">
                            <DroneStatus label="Swarm Alpha-1" status={currentMission.progress === MissionProgress.DELIVERING ? 'Loading' : 'Standby'} progress={currentMission.progress === MissionProgress.DELIVERING ? 35 : 0} />
                            <DroneStatus label="Ground Unit 04" status="Standby" progress={0} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <LayoutDashboard className="w-12 h-12 text-white/10" />
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tighter text-white/40">No Selection</h3>
                <p className="text-xs text-white/20 max-w-[200px] mt-2">
                  Click on an incident marker or the map to begin intervention planning.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Toggle Right Panel Button */}
      <button 
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50 w-6 h-12 glass-panel border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all",
          rightPanelOpen ? "right-96" : "right-0"
        )}
      >
        {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}

function LayerItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
      active ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-white/60"
    )}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
      <div className={cn(
        "ml-auto w-2 h-2 rounded-full",
        active ? "bg-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.8)]" : "bg-white/10"
      )} />
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-[9px] font-medium text-white/60 uppercase">{label}</span>
    </div>
  );
}

function DroneStatus({ label, status, progress }: { label: string, status: string, progress: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
        <span className="text-white/80">{label}</span>
        <span className={cn(
          status === 'En Route' ? "text-cyan-400" : 
          status === 'Loading' ? "text-yellow-400" : "text-white/40"
        )}>{status}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn(
            "h-full transition-all",
            status === 'En Route' ? "bg-cyan-400" : "bg-yellow-400"
          )}
        />
      </div>
    </div>
  );
}

function MiniArmOverview({ detections, currentStep }: { detections: VisionDetection[], currentStep?: string | null }) {
  const armPose = detections.length > 0 ? detections[0].source : [0.42, -0.02, 0.1];

  return (
    <div className="rounded-xl border border-white/10 bg-[#081018] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.24em] text-cyan-300">
          Top-Down Workspace
        </div>
        <div className="text-[8px] uppercase tracking-[0.2em] text-white/30">
          {currentStep ?? 'IDLE'}
        </div>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(20,30,42,0.9),rgba(4,8,12,1))]">
        <div className="absolute inset-4 rounded-[22px] border border-[#f59e0b]/40" />
        <div className="absolute inset-x-8 top-8 h-[1px] bg-cyan-400/10" />
        <div className="absolute inset-x-8 bottom-8 h-[1px] bg-cyan-400/10" />
        <div className="absolute inset-y-8 left-8 w-[1px] bg-cyan-400/10" />
        <div className="absolute inset-y-8 right-8 w-[1px] bg-cyan-400/10" />

        <div
          className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/5 shadow-[0_0_18px_rgba(255,255,255,0.05)]"
          style={{
            left: `${18 + ((armPose[0] - 0.2) / 0.55) * 64}%`,
            top: `${72 - ((armPose[1] + 0.35) / 0.85) * 52}%`
          }}
        >
          <div className="absolute inset-2 rounded-full border border-cyan-400/20" />
          <div className="absolute left-1/2 top-1/2 h-8 w-2 -translate-x-1/2 -translate-y-full rounded-full bg-slate-200/80 shadow-[0_0_14px_rgba(226,232,240,0.35)]" />
          <div className="absolute left-1/2 top-[34%] h-10 w-1 -translate-x-1/2 rounded-full bg-slate-300/80 rotate-45 origin-bottom" />
          <div className="absolute left-1/2 top-[34%] h-8 w-1 -translate-x-1/2 rounded-full bg-slate-300/80 -rotate-45 origin-bottom" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
        </div>

        {detections.map((detection, index) => (
          <div
            key={`${detection.item}-${index}`}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 shadow-[0_0_12px_rgba(0,0,0,0.35)]",
              detection.status === 'ACTIVE'
                ? "border-cyan-400/70 bg-cyan-500/20"
                : "border-white/15 bg-white/10"
            )}
            style={{
              left: `${18 + ((detection.source[0] - 0.2) / 0.55) * 64}%`,
              top: `${72 - ((detection.source[1] + 0.35) / 0.85) * 52}%`
            }}
          >
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/80">
              {detection.item.replace(/_/g, ' ')}
            </div>
          </div>
        ))}

        <div className="absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/35 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-white/45">
          tray view
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-white/35">
        <span>{detections.length} targets</span>
        <span>{detections.find(item => item.status === 'ACTIVE')?.item?.replace(/_/g, ' ') ?? 'awaiting pick'}</span>
      </div>
    </div>
  );
}

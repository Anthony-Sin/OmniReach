
import React from 'react';
import { motion } from 'motion/react';
import { MissionEvent, MissionEventType, AgentType } from '../types/mission';
import { cn } from '../../lib/utils';

interface MissionGraphProps {
  events: MissionEvent[];
}

export function MissionGraph({ events }: MissionGraphProps) {
  const hasEvent = (type: MissionEventType) => events.some(e => e.type === type);
  const getEvent = (type: MissionEventType) => events.find(e => e.type === type);

  const nodes = [
    { id: AgentType.SENTINEL, label: 'Sentinel: Alert Detected', type: MissionEventType.ALERT_DETECTED, color: 'c-blue', x: 210, y: 10 },
    { id: AgentType.TRIAGE, label: 'Triage: Zone Prioritized', type: MissionEventType.ZONE_PRIORITIZED, color: 'c-teal', x: 210, y: 75 },
    { id: AgentType.ASSEMBLY, label: 'Assembly: Kit Plan Created', type: MissionEventType.KIT_PLAN_CREATED, color: 'c-purple', x: 210, y: 140 },
    { id: AgentType.LOGISTICS, label: 'Logistics: Pick Sequence', type: MissionEventType.PICK_SEQUENCE_CREATED, color: 'c-amber', x: 210, y: 205 },
    { id: AgentType.ROBOTICS, label: 'Robotics: Arm Execution', type: MissionEventType.ARM_EXECUTION_COMPLETED, color: 'c-cyan', x: 210, y: 270 },
    { id: AgentType.DELIVERY, label: 'Delivery: Route Created', type: MissionEventType.DELIVERY_ROUTE_CREATED, color: 'c-teal', x: 210, y: 335 },
  ];

  return (
    <div className="w-full h-full bg-black/20 rounded-lg border border-white/5 p-4 overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 680 480" className="w-full h-auto">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
        </defs>

        {nodes.map((node, idx) => {
          const active = hasEvent(node.type);
          const event = getEvent(node.type);
          
          return (
            <g key={node.id} className={cn("node", active ? node.color : "opacity-20")}>
              <motion.rect 
                initial={{ opacity: 0, y: node.y + 10 }}
                animate={{ opacity: 1, y: node.y }}
                x={node.x} y={node.y} width="260" height="50" rx="8" strokeWidth="0.5"
              />
              <text className="th" x={node.x + 130} y={node.y + 18}
                    text-anchor="middle" dominant-baseline="central">
                {node.label}
              </text>
              {event && (
                <text x={node.x + 130} y={node.y + 36}
                      text-anchor="middle" dominant-baseline="central" className="opacity-60 text-[8px]">
                  {event.rationale.length > 45 ? event.rationale.substring(0, 42) + '...' : event.rationale}
                </text>
              )}
              
              {/* Connector */}
              {idx < nodes.length - 1 && (
                <line 
                  x1={node.x + 130} y1={node.y + 50} 
                  x2={node.x + 130} y2={node.y + 75}
                  className={cn("arr", hasEvent(nodes[idx+1].type) ? "stroke-cyan-400" : "opacity-20")} 
                  marker-end="url(#arrow)"
                />
              )}
            </g>
          );
        })}

        {/* Decision Diamond for Mission Complete */}
        <g className={cn("node", hasEvent(MissionEventType.MISSION_COMPLETE) ? "c-teal" : "opacity-20")}>
          <polygon 
            points="340,410 440,435 340,460 240,435"
            fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" strokeWidth="0.5"
          />
          <text x="340" y="435" text-anchor="middle"
                dominant-baseline="central" className="th">
            MISSION COMPLETE
          </text>
        </g>

        {/* Final Connector */}
        <line 
          x1={340} y1={385} x2={340} y2={410}
          className={cn("arr", hasEvent(MissionEventType.MISSION_COMPLETE) ? "stroke-cyan-400" : "opacity-20")} 
          marker-end="url(#arrow)"
        />
      </svg>
    </div>
  );
}

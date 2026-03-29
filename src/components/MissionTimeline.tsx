
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { MissionProgress, MissionEventType, AgentType } from '../types/mission';
import { cn } from '../../lib/utils';

interface MissionTimelineProps {
  progress: MissionProgress;
  currentStep: string;
}

const STEPS = [
  { id: AgentType.SENTINEL, label: 'Monitoring', icon: 'Radio' },
  { id: AgentType.TRIAGE, label: 'Triage', icon: 'ShieldAlert' },
  { id: AgentType.ASSEMBLY, label: 'Planning', icon: 'Package' },
  { id: AgentType.LOGISTICS, label: 'Sequencing', icon: 'Layers' },
  { id: AgentType.ROBOTICS, label: 'Assembly', icon: 'Cpu' },
  { id: AgentType.DELIVERY, label: 'Delivery', icon: 'Drone' },
  { id: 'COMPLETE', label: 'Complete', icon: 'CheckCircle2' }
];

export function MissionTimeline({ progress, currentStep }: MissionTimelineProps) {
  const getStepStatus = (stepId: string) => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    if (progress === MissionProgress.COMPLETED) return 'completed';
    if (progress === MissionProgress.FAILED) return 'failed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-6">
      {STEPS.map((step, idx) => {
        const status = getStepStatus(step.id);
        const isLast = idx === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                status === 'completed' ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]" :
                status === 'active' ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 animate-pulse" :
                status === 'failed' ? "bg-red-500/20 border-red-500 text-red-500" :
                "bg-white/5 border-white/10 text-white/20"
              )}>
                {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                 status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                 <Circle className="w-4 h-4" />}
              </div>
              <span className={cn(
                "text-[8px] uppercase font-bold mt-2 tracking-tighter transition-colors duration-500 whitespace-nowrap",
                status === 'active' ? "text-cyan-400" : "text-white/40"
              )}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2 bg-white/5 relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: status === 'completed' ? '100%' : '0%' }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

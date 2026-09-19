import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Ambulance, 
  Route, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  AlertCircle,
  XCircle,
  Hospital
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmergencyVehicle, IntersectionNode } from '../types/traffic';

interface EmergencyCorridorPanelProps {
  emergencyVehicle: EmergencyVehicle | null;
  nodes: Record<string, IntersectionNode>;
  onSpawnEmergency: (origin: string, destination: string) => void;
  onClearEmergency: () => void;
}

export const EmergencyCorridorPanel: React.FC<EmergencyCorridorPanelProps> = ({
  emergencyVehicle,
  nodes,
  onSpawnEmergency,
  onClearEmergency,
}) => {
  const [origin, setOrigin] = useState('I1');
  const [destination, setDestination] = useState('I6');

  const nodeOptions = [
    { id: 'I1', label: 'I1 - Tech Gateway' },
    { id: 'I2', label: 'I2 - Downtown Center' },
    { id: 'I3', label: 'I3 - Financial Hub' },
    { id: 'I4', label: 'I4 - West Boulevard' },
    { id: 'I5', label: 'I5 - Central Transit' },
    { id: 'I6', label: 'I6 - East Metro Hospital' },
  ];

  const handleSpawn = () => {
    onSpawnEmergency(origin, destination);
  };

  const isActive = emergencyVehicle && emergencyVehicle.is_active;
  const isCompleted = emergencyVehicle && emergencyVehicle.completed;

  // Fire confetti if newly completed
  React.useEffect(() => {
    if (isCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#06B6D4', '#3B82F6']
      });
    }
  }, [isCompleted]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
              EMERGENCY GREEN CORRIDOR ENGINE
            </h2>
            <p className="text-xs text-slate-400">
              Dynamic Signal Preemption & Priority Wave for Emergency Responders
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {isActive ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            CORRIDOR ACTIVE
          </span>
        ) : isCompleted ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            MISSION COMPLETED
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 flex items-center gap-1.5">
            STANDBY
          </span>
        )}
      </div>

      {/* Origin / Destination & Spawn Action */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">
              Vehicle Origin
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              disabled={Boolean(isActive)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono disabled:opacity-50"
            >
              {nodeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">
              Destination Target
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={Boolean(isActive)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono disabled:opacity-50"
            >
              {nodeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={onClearEmergency}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Abort Corridor
            </button>
          ) : (
            <button
              onClick={handleSpawn}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:brightness-110 shadow-green-glow transition flex items-center gap-2"
            >
              <Ambulance className="w-4 h-4 text-slate-950" />
              SPAWN EMERGENCY VEHICLE
            </button>
          )}
        </div>
      </div>

      {/* Active Corridor Telemetry */}
      {emergencyVehicle && (
        <div className="space-y-4">
          {/* Path Visualizer */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase font-mono mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Route className="w-4 h-4 text-emerald-400" />
                Dijkstra Preemption Route: {emergencyVehicle.origin} → {emergencyVehicle.destination}
              </span>
              <span className="text-[11px] text-slate-400">
                Progress: {Math.round(emergencyVehicle.progress * 100)}% on current segment
              </span>
            </div>

            {/* Path Nodes Flow */}
            <div className="flex items-center space-x-2 overflow-x-auto py-2">
              {emergencyVehicle.path.map((nodeId, idx) => {
                const isPassed = idx < emergencyVehicle.current_node_index;
                const isCurrent = idx === emergencyVehicle.current_node_index;
                return (
                  <React.Fragment key={nodeId}>
                    <div
                      className={`px-3 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs transition ${
                        isCurrent
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold shadow-green-glow animate-pulse'
                          : isPassed
                          ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      {nodeId === emergencyVehicle.destination ? (
                        <Hospital className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                      <span>{nodeId}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-950 text-emerald-400 font-bold">
                        GREEN
                      </span>
                    </div>
                    {idx < emergencyVehicle.path.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Time Saved & ETA Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard ETA</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                {emergencyVehicle.normal_eta_sec}s
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">With red signal delays</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Corridor ETA</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {emergencyVehicle.optimized_eta_sec}s
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Preempted green waves</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Saved</div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                -{emergencyVehicle.time_saved_sec}s ({Math.round((emergencyVehicle.time_saved_sec / emergencyVehicle.normal_eta_sec) * 100)}%)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Critical life-saving margin</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Corridor Nodes</div>
              <div className="text-lg font-bold font-mono text-purple-300 mt-1">
                {emergencyVehicle.affected_intersections.length} Intersections
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cross-traffic restricted</div>
            </div>
          </div>

          {/* Completion Banner */}
          {isCompleted && (
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                GREEN CORRIDOR COMPLETE — Ambulance Safely Arrived at Hospital
              </div>
              <span className="text-[11px] text-slate-400">
                Signals restored to normal adaptive rotation.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

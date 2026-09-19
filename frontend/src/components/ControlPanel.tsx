import React, { useState } from 'react';
import { 
  Sliders, 
  Flame, 
  AlertOctagon, 
  ShieldAlert, 
  Car, 
  RefreshCw, 
  Sparkles,
  Compass
} from 'lucide-react';

interface ControlPanelProps {
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  demandNS: number;
  demandEW: number;
  onSetDemand: (level: string, ns: number, ew: number) => void;
  onCongestion: (nodeId: string) => void;
  onAccident: (roadId: string) => void;
  onRoadClosure: (roadId: string) => void;
  onClearEvents: () => void;
  onApplyPreset: (preset: string) => void;
  activeEvents: Array<{ type: string; target: string; description: string }>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  demandLevel,
  demandNS,
  demandEW,
  onSetDemand,
  onCongestion,
  onAccident,
  onRoadClosure,
  onClearEvents,
  onApplyPreset,
  activeEvents,
}) => {
  const [selectedNodeForCongestion, setSelectedNodeForCongestion] = useState('I2');
  const [selectedRoadForEvent, setSelectedRoadForEvent] = useState('I2->I5');
  const [nsSlider, setNsSlider] = useState(demandNS);
  const [ewSlider, setEwSlider] = useState(demandEW);

  const demandLevels: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'> = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];

  const presets = [
    { name: 'Normal City', desc: 'Moderate balanced city flow' },
    { name: 'Rush Hour', desc: 'Heavy demand across all lanes' },
    { name: 'Accident', desc: 'Crash on I2->I5 artery with rerouting' },
    { name: 'Emergency', desc: 'Ambulance transit I1 to I6' },
    { name: 'Rush Hour + Emergency', desc: 'Gridlock with green wave preemption' },
    { name: 'Road Closure + Emergency', desc: 'Blocked segment forcing detour' },
  ];

  const handleSliderChange = (type: 'ns' | 'ew', val: number) => {
    if (type === 'ns') {
      setNsSlider(val);
      onSetDemand(demandLevel, val, ewSlider);
    } else {
      setEwSlider(val);
      onSetDemand(demandLevel, nsSlider, val);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-4">
      {/* 1. Demand Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Traffic Demand Simulation
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            {demandLevel} FLOW
          </span>
        </div>

        {/* Level Toggle Buttons */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          {demandLevels.map((lvl) => {
            const isActive = demandLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => onSetDemand(lvl, nsSlider, ewSlider)}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition font-mono ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-quantum-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        {/* Directional Sliders */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>North-South Bias:</span>
              <span className="text-cyan-300 font-mono">{nsSlider.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={nsSlider}
              onChange={(e) => handleSliderChange('ns', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>East-West Bias:</span>
              <span className="text-indigo-300 font-mono">{ewSlider.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={ewSlider}
              onChange={(e) => handleSliderChange('ew', parseFloat(e.target.value))}
              className="w-full accent-indigo-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-800/80" />

      {/* 2. Dynamic Events Injection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Dynamic Real-time Events
            </h3>
          </div>
          {activeEvents.length > 0 && (
            <button
              onClick={onClearEvents}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 underline"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Active ({activeEvents.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Congestion Spike */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              Surge Buildup
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedNodeForCongestion}
                onChange={(e) => setSelectedNodeForCongestion(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-200 font-mono w-full"
              >
                {['I1', 'I2', 'I3', 'I4', 'I5', 'I6'].map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <button
                onClick={() => onCongestion(selectedNodeForCongestion)}
                className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 whitespace-nowrap"
              >
                Trigger
              </button>
            </div>
          </div>

          {/* Accident */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-orange-400" />
              Accident
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRoadForEvent}
                onChange={(e) => setSelectedRoadForEvent(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-200 font-mono w-full"
              >
                {['I1->I2', 'I2->I3', 'I1->I4', 'I2->I5', 'I3->I6', 'I4->I5', 'I5->I6'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={() => onAccident(selectedRoadForEvent)}
                className="px-2.5 py-1 text-xs font-bold rounded bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40 whitespace-nowrap"
              >
                Accident
              </button>
            </div>
          </div>

          {/* Road Closure */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Road Closure
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRoadForEvent}
                onChange={(e) => setSelectedRoadForEvent(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-200 font-mono w-full"
              >
                {['I1->I2', 'I2->I3', 'I1->I4', 'I2->I5', 'I3->I6', 'I4->I5', 'I5->I6'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={() => onRoadClosure(selectedRoadForEvent)}
                className="px-2.5 py-1 text-xs font-bold rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-800/80" />

      {/* 3. Scenario Presets */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            One-Click Scenario Presets
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => onApplyPreset(p.name)}
              className="p-2 text-left rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 transition group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300 font-mono">
                {p.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {p.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

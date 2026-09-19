import React from 'react';
import { 
  Info, 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  Activity, 
  ExternalLink,
  Code2,
  GitBranch,
  Flame,
  CheckCircle2
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <Info className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
            ABOUT QUANTUMFLOW
          </h2>
          <p className="text-xs text-slate-400">
            Next-Generation Hybrid Quantum-Classical Intelligent Traffic Management
          </p>
        </div>
      </div>

      {/* Problem & Solution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* The Problem */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 font-mono uppercase">
            <Flame className="w-4 h-4" />
            The Urban Traffic Problem
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Metropolitan traffic control systems overwhelmingly rely on fixed cycle splits or isolated sensor loops that fail to coordinate across interconnected grid intersections. During rush hour, accidents, or transit emergencies, this creates catastrophic congestion cascades, inflating idle times, burning millions of liters of wasted fuel, and delaying life-critical emergency responders.
          </p>
        </div>

        {/* The Solution */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono uppercase">
            <Sparkles className="w-4 h-4" />
            The QuantumFlow Solution
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            QuantumFlow frames multi-intersection signal timing as a Quadratic Unconstrained Binary Optimization (QUBO) program. Using QAOA executed on Qiskit Aer, candidate signal timings across the entire network are co-evaluated simultaneously. A dynamic Emergency Green Corridor engine preempts traffic lights along ambulance routes, guaranteeing rapid transit.
          </p>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Real QAOA & QUBO
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Genuine Qiskit 2.5 and AerSimulator running parametric quantum circuits with COBYLA classical angle refinement.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Green Corridor
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            NetworkX shortest-path calculation with real-time signal preemption and animated ambulance progression.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Digital Twin Simulation
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Microscopic kinematics tracking vehicle acceleration, queue formation, and dynamic congestion surge events.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Eco & CO₂ Models
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Realistic fuel consumption and carbon footprint estimates comparing Classical vs Hybrid Quantum outcomes.
          </p>
        </div>
      </div>

      {/* Tech Stack & Architecture Details */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
          Technology Stack
        </h3>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300">FastAPI</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-blue-300">Qiskit 2.5</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-purple-300">Qiskit Aer 0.17</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300">NetworkX</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300">NumPy & SciPy</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-200">React 19 & TypeScript</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-sky-300">Tailwind CSS</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-pink-300">WebSockets</span>
        </div>
      </div>
    </div>
  );
};

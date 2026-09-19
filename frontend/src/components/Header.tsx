import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Cpu, 
  Sparkles, 
  Activity, 
  Sliders, 
  ShieldAlert, 
  BarChart3, 
  BookOpen, 
  Info,
  Server
} from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onClassicalOptimize: () => void;
  onQuantumOptimize: () => void;
  onRunDemo: () => void;
  onOpenStatus: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOptimizing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onClassicalOptimize,
  onQuantumOptimize,
  onRunDemo,
  onOpenStatus,
  activeTab,
  setActiveTab,
  isOptimizing,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Command Dashboard', icon: Activity },
    { id: 'optimization', label: 'QUBO / QAOA Engine', icon: Cpu },
    { id: 'emergency', label: 'Emergency Corridor', icon: ShieldAlert },
    { id: 'analytics', label: 'Live Analytics & Comparison', icon: BarChart3 },
    { id: 'explainer', label: 'Quantum Explainer', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner with Branding and Global Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-quantum-glow flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent font-mono">
                QUANTUMFLOW
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                SYSTEM ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Hybrid Quantum-Classical Urban Traffic Optimization Platform
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Simulation Play / Pause / Reset */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            {isRunning ? (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30"
                title="Pause Simulation"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            ) : (
              <button
                onClick={onStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/30"
                title="Start Simulation"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
                Start Simulation
              </button>
            )}
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition ml-1"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Classical Optimize */}
          <button
            onClick={onClassicalOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700/80 border border-slate-700 transition disabled:opacity-50"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Classical Baseline
          </button>

          {/* Hybrid Quantum Optimize */}
          <button
            onClick={onQuantumOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-quantum-glow transition disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-200" />
            {isOptimizing ? 'Optimizing (QAOA)...' : 'Hybrid Quantum Optimize'}
          </button>

          {/* 1-Click Demo Mode Button */}
          <button
            onClick={onRunDemo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-purple-500/20 border border-purple-400/40 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-200 animate-spin" />
            1-Click Demo Mode
          </button>

          {/* System Status Button */}
          <button
            onClick={onOpenStatus}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
            title="System Diagnostics"
          >
            <Server className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto scrollbar-none border-t border-slate-800/50">
        <nav className="flex space-x-1 py-1.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

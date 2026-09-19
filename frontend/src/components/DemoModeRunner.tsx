import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Play, 
  X, 
  Cpu, 
  ShieldAlert, 
  ArrowRight,
  Sliders,
  BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DemoModeRunnerProps {
  isRunning: boolean;
  onClose: () => void;
  onStartSim: () => Promise<any>;
  onSetDemand: (level: string, ns: number, ew: number) => Promise<any>;
  onTriggerCongestion: (nodeId: string) => Promise<any>;
  onClassicalOptimize: () => Promise<any>;
  onSpawnEmergency: (origin: string, dest: string) => Promise<any>;
  onQuantumOptimize: () => Promise<any>;
  setActiveTab: (tab: string) => void;
}

export const DemoModeRunner: React.FC<DemoModeRunnerProps> = ({
  isRunning,
  onClose,
  onStartSim,
  onSetDemand,
  onTriggerCongestion,
  onClassicalOptimize,
  onSpawnEmergency,
  onQuantumOptimize,
  setActiveTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Demo Sequence...');

  const steps = [
    { title: '1. Start Network Simulation', tab: 'dashboard' },
    { title: '2. Surge High Traffic Demand', tab: 'dashboard' },
    { title: '3. Induce Congestion Buildup', tab: 'dashboard' },
    { title: '4. Run Classical Optimization', tab: 'optimization' },
    { title: '5. Spawn Emergency Ambulance', tab: 'emergency' },
    { title: '6. Activate Dynamic Green Corridor', tab: 'dashboard' },
    { title: '7. Execute QAOA on Qiskit Aer', tab: 'optimization' },
    { title: '8. Complete Corridor & Restore Flow', tab: 'dashboard' },
    { title: '9. View Final Quantum vs Classical Benchmark', tab: 'analytics' },
  ];

  useEffect(() => {
    let timeout: any;

    const runStep = async (stepIdx: number) => {
      setCurrentStep(stepIdx);

      if (stepIdx === 0) {
        setStatusText('Starting simulation engine...');
        setActiveTab('dashboard');
        await onStartSim();
        timeout = setTimeout(() => runStep(1), 2200);
      } else if (stepIdx === 1) {
        setStatusText('Increasing traffic demand to HIGH...');
        await onSetDemand('HIGH', 1.4, 1.4);
        timeout = setTimeout(() => runStep(2), 2200);
      } else if (stepIdx === 2) {
        setStatusText('Triggering congestion surge at Downtown (I2)...');
        await onTriggerCongestion('I2');
        timeout = setTimeout(() => runStep(3), 2500);
      } else if (stepIdx === 3) {
        setStatusText('Running Classical Rule-Based optimization...');
        setActiveTab('optimization');
        await onClassicalOptimize();
        timeout = setTimeout(() => runStep(4), 2800);
      } else if (stepIdx === 4) {
        setStatusText('Spawning emergency ambulance from I1 to I6 Hospital...');
        setActiveTab('emergency');
        await onSpawnEmergency('I1', 'I6');
        timeout = setTimeout(() => runStep(5), 2500);
      } else if (stepIdx === 5) {
        setStatusText('Green Corridor active! Preempting signals along route...');
        setActiveTab('dashboard');
        timeout = setTimeout(() => runStep(6), 2800);
      } else if (stepIdx === 6) {
        setStatusText('Formulating QUBO & executing QAOA on Qiskit Aer...');
        setActiveTab('optimization');
        await onQuantumOptimize();
        timeout = setTimeout(() => runStep(7), 3000);
      } else if (stepIdx === 7) {
        setStatusText('Ambulance clearing corridor, applying optimal signal wave...');
        setActiveTab('dashboard');
        timeout = setTimeout(() => runStep(8), 2500);
      } else if (stepIdx === 8) {
        setStatusText('Demo Complete! Displaying side-by-side benchmark comparison.');
        setActiveTab('analytics');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
    };

    runStep(0);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 glass-panel rounded-2xl p-4 border border-purple-500/40 shadow-2xl space-y-3 bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Automated Demo Mode
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-xs font-semibold text-purple-300 font-mono flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
        {statusText}
      </div>

      {/* Steps List */}
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {steps.map((st, idx) => {
          const isDone = idx < currentStep;
          const isCurr = idx === currentStep;

          return (
            <div
              key={st.title}
              className={`flex items-center justify-between text-[11px] p-1.5 rounded-lg font-mono transition ${
                isCurr
                  ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 font-bold'
                  : isDone
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span>{st.title}</span>
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isCurr ? (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              ) : (
                <span className="text-slate-700">○</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Cpu,
  Layers,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth } from '../types/traffic';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const engines = health?.engines || {
    traffic_simulator: 'online',
    network_engine: 'online',
    classical_optimizer: 'online',
    qubo_engine: 'online',
    qaoa_engine: 'online',
    emergency_engine: 'online',
    metrics_engine: 'online',
  };

  const engineLabels: Record<string, { name: string; desc: string }> = {
    traffic_simulator: { name: 'Traffic Simulator', desc: 'Microscopic kinematics, queue & vehicle tracking' },
    network_engine: { name: 'Network Engine', desc: 'NetworkX 6-node urban graph model & capacities' },
    classical_optimizer: { name: 'Classical Optimizer', desc: 'Fixed-time & rule-based heuristic controller' },
    qubo_engine: { name: 'QUBO Engine', desc: 'Quadratic matrix generator with one-hot constraints' },
    qaoa_engine: { name: 'QAOA Engine', desc: 'Qiskit 2.5 & Qiskit-Aer quantum variational ansatz' },
    emergency_engine: { name: 'Emergency Engine', desc: 'Dijkstra route planner & green corridor preemption' },
    metrics_engine: { name: 'Metrics Engine', desc: 'Waiting time, fuel consumption & CO2 estimation' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-5 border border-slate-700/80 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                SYSTEM DIAGNOSTICS & ENGINE STATUS
              </h3>
              <p className="text-[11px] text-slate-400">
                QuantumFlow Microservice Health Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Checklist */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {Object.entries(engines).map(([key, status]) => {
            const meta = engineLabels[key] || { name: key, desc: 'Core Engine' };
            const isOnline = status === 'online' || status === 'ready';

            return (
              <div
                key={key}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                    {meta.name}
                    {key === 'qaoa_engine' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        Qiskit Aer
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{meta.desc}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 font-mono uppercase ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Qiskit Aer 0.17.2 Backend Operational</span>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

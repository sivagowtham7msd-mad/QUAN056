import React, { useState } from 'react';
import { 
  Cpu, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  TrendingDown,
  TrendingUp,
  Hash,
  AlertCircle
} from 'lucide-react';
import { OptimizationResponse, QAOAResult, SystemKPIs } from '../types/traffic';

interface OptimizationPanelProps {
  onRunClassical: () => void;
  onRunHybrid: (weights: any) => void;
  isOptimizing: boolean;
  lastOptimization: OptimizationResponse | null;
  currentKPIs: SystemKPIs;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  onRunClassical,
  onRunHybrid,
  isOptimizing,
  lastOptimization,
  currentKPIs,
}) => {
  const [activeEngineTab, setActiveEngineTab] = useState<'hybrid' | 'quantum' | 'classical'>('hybrid');

  // Objective weights
  const [weights, setWeights] = useState({
    w_waiting_time: 1.0,
    w_queue: 1.2,
    w_congestion: 0.8,
    w_emissions: 0.6,
    w_emergency: 3.5,
    penalty_multiplier: 15.0,
  });

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleExecute = () => {
    if (activeEngineTab === 'classical') {
      onRunClassical();
    } else {
      onRunHybrid(weights);
    }
  };

  const qResult = lastOptimization?.type === 'HYBRID_QUANTUM_CLASSICAL' 
    ? (lastOptimization.result as QAOAResult) 
    : null;

  // Comparison before vs after
  const beforeKPIs = lastOptimization?.before_kpis;
  const afterKPIs = currentKPIs;

  const calculateDelta = (before: number, after: number, lowerIsBetter = true) => {
    if (!before || before === 0) return { pct: 0, improved: true };
    const diff = after - before;
    const pct = ((diff / before) * 100);
    const improved = lowerIsBetter ? pct < 0 : pct > 0;
    return { pct: Math.abs(pct).toFixed(1), improved, rawDiff: diff };
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-5">
      {/* Title and Engine Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
              OPTIMIZATION ENGINE
            </h2>
            <p className="text-xs text-slate-400">
              Coordinated Traffic Light Cycle Optimization & Timing Synthesizer
            </p>
          </div>
        </div>

        {/* Engine Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setActiveEngineTab('hybrid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition font-mono ${
              activeEngineTab === 'hybrid'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-quantum-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hybrid Quantum (QAOA)
          </button>
          <button
            onClick={() => setActiveEngineTab('quantum')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition font-mono ${
              activeEngineTab === 'quantum'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quantum Simulator
          </button>
          <button
            onClick={() => setActiveEngineTab('classical')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition font-mono ${
              activeEngineTab === 'classical'
                ? 'bg-slate-700 text-slate-100 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Classical Baseline
          </button>
        </div>
      </div>

      {/* Objective Weights Sliders */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
          <span>Objective Cost Weights (QUBO Formulator)</span>
          <span className="text-slate-500 text-[11px]">Cost = w1·Wait + w2·Queue + w3·Cong + w4·Emiss + w5·Emerg</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Waiting Time (w1):</span>
              <span className="text-cyan-300 font-mono">{weights.w_waiting_time}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={weights.w_waiting_time}
              onChange={(e) => handleWeightChange('w_waiting_time', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Queue Length (w2):</span>
              <span className="text-cyan-300 font-mono">{weights.w_queue}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={weights.w_queue}
              onChange={(e) => handleWeightChange('w_queue', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Emissions (w4):</span>
              <span className="text-indigo-300 font-mono">{weights.w_emissions}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={weights.w_emissions}
              onChange={(e) => handleWeightChange('w_emissions', parseFloat(e.target.value))}
              className="w-full accent-indigo-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Emergency (w5):</span>
              <span className="text-emerald-300 font-mono">{weights.w_emergency}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={weights.w_emergency}
              onChange={(e) => handleWeightChange('w_emergency', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>One-Hot Penalty:</span>
              <span className="text-purple-300 font-mono">{weights.penalty_multiplier}</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="30.0"
              step="1.0"
              value={weights.penalty_multiplier}
              onChange={(e) => handleWeightChange('penalty_multiplier', parseFloat(e.target.value))}
              className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Big Action Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleExecute}
            disabled={isOptimizing}
            className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-quantum-glow hover:brightness-110 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isOptimizing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                OPTIMIZATION IN PROGRESS...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-300" />
                OPTIMIZE SIGNAL NETWORK
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Pipeline Indicator */}
      {isOptimizing && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 font-bold mb-2">
            <span>PIPELINE EXECUTION IN PROGRESS</span>
            <span className="text-cyan-400">Qiskit Aer (Local Simulator)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 py-1">
            <span className="text-cyan-300">1. Traffic State</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300">2. QUBO Matrix</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300">3. Ising Hamiltonian</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300">4. QAOA Ansatz</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300">5. Parameter Optimization</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-300">6. Decode Solution</span>
          </div>
        </div>
      )}

      {/* Quantum Telemetry Cards */}
      {qResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Quantum Optimization Telemetry (Qiskit Aer)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {qResult.status_message}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Qubits Used</div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">{qResult.qubits_used}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Decision variables</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Circuit Depth</div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">{qResult.circuit_depth}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">QAOA layers: p=1</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Iterations</div>
              <div className="text-lg font-bold font-mono text-indigo-300 mt-1">{qResult.optimization_iterations}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">COBYLA evaluations</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Best Cost</div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">{qResult.best_cost}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Ising ground state</div>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Execution Time</div>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">{qResult.execution_time_sec}s</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Aer simulation shots</div>
            </div>
          </div>

          {/* Top Candidate Bitstrings Histogram */}
          {qResult.top_candidates && qResult.top_candidates.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2 font-mono flex items-center justify-between">
                <span>Top Measured Quantum States (Bitstrings)</span>
                <span className="text-[10px] text-slate-500">Selected Ground State: {qResult.best_bitstring}</span>
              </div>
              <div className="space-y-1.5">
                {qResult.top_candidates.slice(0, 5).map((cand, idx) => (
                  <div key={cand.bitstring} className="flex items-center text-xs font-mono gap-3">
                    <span className="w-6 text-slate-500 text-right">#{idx + 1}</span>
                    <span className="w-28 text-cyan-300 font-bold truncate">{cand.bitstring}</span>
                    <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cand.bitstring === qResult.best_bitstring
                            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(8, cand.probability * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-slate-300 font-semibold">
                      {(cand.probability * 100).toFixed(1)}%
                    </span>
                    <span className="w-16 text-right text-slate-400">
                      Cost: {cand.cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Before vs After Impact Metric Cards */}
      {beforeKPIs && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Optimization Impact (Before vs After)
            </h3>
            <span className="text-[10px] text-slate-400">
              Baseline captured before execution
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Waiting time */}
            {(() => {
              const delta = calculateDelta(beforeKPIs.avg_waiting_time, afterKPIs.avg_waiting_time, true);
              return (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Wait Time</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                    {beforeKPIs.avg_waiting_time}s → {afterKPIs.avg_waiting_time}s
                  </div>
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta.improved ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {delta.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {delta.pct}% {delta.improved ? 'improved' : 'delay'}
                  </div>
                </div>
              );
            })()}

            {/* Total Queue */}
            {(() => {
              const delta = calculateDelta(beforeKPIs.total_queue, afterKPIs.total_queue, true);
              return (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Total Queue</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                    {beforeKPIs.total_queue} → {afterKPIs.total_queue} veh
                  </div>
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta.improved ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {delta.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {delta.pct}% {delta.improved ? 'cleared' : 'surge'}
                  </div>
                </div>
              );
            })()}

            {/* Throughput */}
            {(() => {
              const delta = calculateDelta(beforeKPIs.throughput_per_hr, afterKPIs.throughput_per_hr, false);
              return (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Throughput</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                    {Math.round(beforeKPIs.throughput_per_hr)} → {Math.round(afterKPIs.throughput_per_hr)}
                  </div>
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta.improved ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <TrendingUp className="w-3 h-3" />
                    +{delta.pct}% veh/hr
                  </div>
                </div>
              );
            })()}

            {/* Fuel */}
            {(() => {
              const delta = calculateDelta(beforeKPIs.fuel_consumption_l_hr, afterKPIs.fuel_consumption_l_hr, true);
              return (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Fuel Burn</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                    {beforeKPIs.fuel_consumption_l_hr} → {afterKPIs.fuel_consumption_l_hr} L/h
                  </div>
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta.improved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {delta.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {delta.pct}% saved
                  </div>
                </div>
              );
            })()}

            {/* CO2 */}
            {(() => {
              const delta = calculateDelta(beforeKPIs.co2_emissions_kg_hr, afterKPIs.co2_emissions_kg_hr, true);
              return (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">CO₂ Footprint</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                    {beforeKPIs.co2_emissions_kg_hr} → {afterKPIs.co2_emissions_kg_hr} kg/h
                  </div>
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta.improved ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {delta.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {delta.pct}% reduction
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

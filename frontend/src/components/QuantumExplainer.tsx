import React, { useState } from 'react';
import { 
  BookOpen, 
  Cpu, 
  Binary, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Atom, 
  Sparkles,
  Info
} from 'lucide-react';

export const QuantumExplainer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'step1',
      title: '1. Traffic State & Queues',
      badge: 'Classical Input',
      desc: 'Real-time vehicle counts, queue lengths, and emergency vehicle routing are captured across all 6 interconnected intersections in the digital twin.',
      detail: 'Intersections: I1 to I6. Each intersection has candidate green splits (e.g. 42s NS / 18s EW vs 18s NS / 42s EW).',
      math: 'q_{i, \\text{NS}}, q_{i, \\text{EW}} \\in \\mathbb{N}, \\quad \\text{Emergency Path} \\in \\{I_1 \\to \\dots \\to I_6\\}',
      icon: Layers,
    },
    {
      id: 'step2',
      title: '2. QUBO Formulation',
      badge: 'Quadratic Matrix',
      desc: 'We define binary decision variables x_{i,k} ∈ {0,1} indicating whether intersection i chooses timing option k.',
      detail: 'The cost function penalizes total wait time, queue spikes, emissions, and emergency delays, plus a quadratic penalty P (\\sum x - 1)^2 enforcing exactly one valid timing per intersection.',
      math: '\\min_{x \\in \\{0,1\\}^n} x^T Q x + c, \\quad Q \\in \\mathbb{R}^{12 \\times 12}',
      icon: Binary,
    },
    {
      id: 'step3',
      title: '3. Ising Spin Hamiltonian',
      badge: 'Quantum Mapping',
      desc: 'QUBO binary variables {0, 1} are mapped to quantum spin Pauli-Z operators {+1, -1} via x_i = (I - Z_i)/2.',
      detail: 'This yields a physical cost Hamiltonian H_C where diagonal couplings J_{ij} represent green-wave coordination between adjacent road segments.',
      math: 'H_C = \\sum_i h_i Z_i + \\sum_{i < j} J_{ij} Z_i Z_j + \\text{offset}',
      icon: Atom,
    },
    {
      id: 'step4',
      title: '4. QAOA Variational Circuit',
      badge: 'Qiskit Aer Execution',
      desc: 'Initializes an equal superposition |+⟩^n across all 12 qubits, then alternates cost unitary U(C, γ) and transverse mixer U(B, β).',
      detail: 'Cost unitary applies RZ and CNOT-RZ-CNOT gates; mixer unitary applies RX rotations. Executed with 512–1024 shots on Qiskit Aer.',
      math: '|\\psi(\\gamma, \\beta)\\rangle = \\prod_{l=1}^p e^{-i \\beta_l H_M} e^{-i \\gamma_l H_C} |+\\rangle^{\\otimes n}',
      icon: Cpu,
    },
    {
      id: 'step5',
      title: '5. Hybrid Loop & Solution Decode',
      badge: 'Classical Optimization',
      desc: 'Classical optimizer (COBYLA) iteratively adjusts rotation angles (γ, β) to minimize the expectation value ⟨ψ|H_C|ψ⟩.',
      detail: 'The optimal quantum state is measured, the lowest-energy bitstring is selected, decoded into green phase durations, and dispatched to the signal controllers.',
      math: '(\\gamma^*, \\beta^*) = \\arg\\min \\langle H_C \\rangle \\implies \\text{Bitstring} \\to \\text{Signal Timings}',
      icon: Sparkles,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <BookOpen className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
            HOW QUANTUM OPTIMIZATION WORKS
          </h2>
          <p className="text-xs text-slate-400">
            A Judge-Friendly Guide to Quadratic Unconstrained Binary Optimization & QAOA
          </p>
        </div>
      </div>

      {/* Core Hackathon Pitch Quote */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/50 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed font-sans">
        <p className="font-semibold text-cyan-200 mb-1">
          "Traffic signal coordination creates a high-dimensional combinatorial optimization problem. Traditional fixed timers or local greedy sensors cause gridlock cascade. QuantumFlow models network-wide phase coupling as a QUBO matrix, executes QAOA on Qiskit Aer to explore conflicting signal configurations simultaneously, and applies classical feedback to converge on minimal delay and emissions."
        </p>
      </div>

      {/* Interactive Pipeline Step Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === idx;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-quantum-glow'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  STEP {idx + 1}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-bold font-mono truncate">{step.title.split('. ')[1]}</div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      {(() => {
        const curr = steps[activeStep];
        const Icon = curr.icon;
        return (
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Icon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">{curr.title}</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {curr.badge}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {curr.desc}
            </p>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Implementation Details: </span>
              {curr.detail}
            </div>

            <div className="p-3 rounded-lg bg-[#070A10] border border-cyan-900/40 font-mono text-xs text-cyan-300 flex items-center justify-between overflow-x-auto">
              <span>{curr.math}</span>
              <span className="text-[10px] text-slate-500 uppercase">Mathematical Formalism</span>
            </div>
          </div>
        );
      })()}

      {/* FAQ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
          <div className="font-bold text-slate-200 font-mono">Why QAOA for Traffic?</div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            Traffic networks have non-local cross-intersection interference. QAOA leverages quantum superposition and entanglement to explore multi-intersection phase assignments in parallel.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
          <div className="font-bold text-slate-200 font-mono">Why Hybrid Quantum-Classical?</div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            NISQ quantum processors excel at sampling ground states of parameterized Hamiltonians, while classical processors efficiently compute gradient steps (COBYLA) and validate safety constraints.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
          <div className="font-bold text-slate-200 font-mono">Real Quantum Simulator</div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            Powered by genuine Qiskit 2.5 and Qiskit Aer. When IBM Quantum hardware credentials are provided, circuits can run on real superconducting transmon qubits.
          </div>
        </div>
      </div>
    </div>
  );
};

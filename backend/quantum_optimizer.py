import time
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from pydantic import BaseModel
from scipy.optimize import minimize

try:
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False

class QAOAExecutionResult(BaseModel):
    qubits_used: int
    circuit_depth: int
    gate_count: Dict[str, int]
    optimization_iterations: int
    best_cost: float
    execution_time_sec: float
    best_bitstring: str
    top_candidates: List[Dict[str, Any]]
    circuit_ascii: Optional[str] = None
    optimized_timings: Dict[str, Dict[str, Any]]
    quantum_executed: bool = True
    fallback_active: bool = False
    status_message: str = "QAOA executed successfully on Qiskit Aer"

class QuantumOptimizer:
    """
    Hybrid Quantum-Classical Optimizer implementing QAOA on Qiskit Aer.
    """
    def __init__(self, p_layers: int = 1, shots: int = 512):
        self.p_layers = p_layers
        self.shots = shots
        self.simulator = AerSimulator() if QISKIT_AVAILABLE else None

    def qubo_to_ising(
        self, Q: np.ndarray, constant_offset: float = 0.0
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Converts QUBO (x in {0,1}) to Ising Hamiltonian (Z in {+1, -1}):
        x_i = (I - Z_i) / 2
        """
        n = Q.shape[0]
        h = np.zeros(n, dtype=float)
        J = np.zeros((n, n), dtype=float)
        offset = constant_offset

        # Linear and diagonal terms
        for i in range(n):
            q_ii = Q[i, i]
            # q_ii * x_i = q_ii * (1 - Z_i) / 2 = q_ii/2 - (q_ii/2) * Z_i
            offset += q_ii / 2.0
            h[i] -= q_ii / 2.0

        # Quadratic terms
        for i in range(n):
            for j in range(i + 1, n):
                q_ij = Q[i, j]
                if abs(q_ij) > 1e-9:
                    # q_ij * x_i * x_j = q_ij * (1 - Z_i - Z_j + Z_i*Z_j) / 4
                    offset += q_ij / 4.0
                    h[i] -= q_ij / 4.0
                    h[j] -= q_ij / 4.0
                    J[i, j] = q_ij / 4.0

        return h, J, offset

    def build_qaoa_circuit(
        self, n: int, h: np.ndarray, J: np.ndarray, gamma: List[float], beta: List[float]
    ) -> Any:
        """
        Builds the QAOA circuit for p layers.
        """
        qc = QuantumCircuit(n, n)
        # Initial state: equal superposition |+>^n
        qc.h(range(n))

        for p in range(self.p_layers):
            g = gamma[p]
            b = beta[p]

            # Cost Hamiltonian phase separation: e^{-i gamma H_C}
            # 1-qubit terms
            for i in range(n):
                if abs(h[i]) > 1e-6:
                    qc.rz(2.0 * g * h[i], i)

            # 2-qubit terms
            for i in range(n):
                for j in range(i + 1, n):
                    if abs(J[i, j]) > 1e-6:
                        qc.cx(i, j)
                        qc.rz(2.0 * g * J[i, j], j)
                        qc.cx(i, j)

            # Mixer Hamiltonian: e^{-i beta H_M}
            for i in range(n):
                qc.rx(2.0 * b, i)

        qc.measure(range(n), range(n))
        return qc

    def optimize_traffic(
        self,
        Q: np.ndarray,
        var_labels: List[str],
        constant_offset: float,
        qubo_engine: Any,
        maxiter: int = 15
    ) -> QAOAExecutionResult:
        """
        Executes hybrid QAOA parameter optimization and candidate bitstring readout.
        """
        start_time = time.time()
        n = len(var_labels)

        if not QISKIT_AVAILABLE or self.simulator is None:
            return self._classical_fallback(
                Q, var_labels, constant_offset, qubo_engine,
                "Qiskit or Aer simulator unavailable — classical fallback active."
            )

        try:
            h, J, offset = self.qubo_to_ising(Q, constant_offset)

            # Classical optimization loop for (gamma, beta)
            eval_count = 0

            def objective_fn(params):
                nonlocal eval_count
                eval_count += 1
                gamma = [params[i] for i in range(self.p_layers)]
                beta = [params[self.p_layers + i] for i in range(self.p_layers)]

                qc = self.build_qaoa_circuit(n, h, J, gamma, beta)
                job = self.simulator.run(qc, shots=self.shots)
                result = job.result()
                counts = result.get_counts()

                # Calculate expected cost
                total_shots = sum(counts.values())
                expected_cost = 0.0
                for bitstring, count in counts.items():
                    # Qiskit bitstrings are little-endian (qubit 0 is rightmost)
                    # Reverse so index 0 is qubit 0
                    ordered_bits = bitstring[::-1]
                    x = np.array([int(b) for b in ordered_bits[:n]])
                    cost = qubo_engine.evaluate_cost(x, Q, constant_offset)
                    expected_cost += (count / total_shots) * cost

                return expected_cost

            # Initial parameters: gamma in [0, 2pi], beta in [0, pi]
            init_params = [0.4] * self.p_layers + [0.3] * self.p_layers

            opt_res = minimize(
                objective_fn,
                init_params,
                method="COBYLA",
                options={"maxiter": maxiter, "rhobeg": 0.3}
            )

            opt_gamma = [opt_res.x[i] for i in range(self.p_layers)]
            opt_beta = [opt_res.x[self.p_layers + i] for i in range(self.p_layers)]

            # Final measurement run with optimal angles and higher shots
            final_qc = self.build_qaoa_circuit(n, h, J, opt_gamma, opt_beta)
            transpiled_qc = transpile(final_qc, self.simulator)
            job = self.simulator.run(transpiled_qc, shots=1024)
            final_counts = job.result().get_counts()

            # Analyze measurement samples
            total_shots = sum(final_counts.values())
            candidates = []
            best_cost = float("inf")
            best_bitstring = "0" * n

            for bitstring, count in final_counts.items():
                ordered_bits = bitstring[::-1][:n]
                x = np.array([int(b) for b in ordered_bits])
                cost = qubo_engine.evaluate_cost(x, Q, constant_offset)

                prob = count / total_shots
                candidates.append({
                    "bitstring": ordered_bits,
                    "probability": round(prob, 4),
                    "cost": round(cost, 2),
                    "count": count
                })

                if cost < best_cost:
                    best_cost = cost
                    best_bitstring = ordered_bits

            # Sort top candidates by probability descending
            candidates.sort(key=lambda item: item["probability"], reverse=True)
            top_candidates = candidates[:8]

            # Gate count and circuit metrics
            gate_count = dict(final_qc.count_ops())
            circuit_depth = final_qc.depth()

            # Decode optimal signal timings
            timings = qubo_engine.decode_solution(best_bitstring, var_labels)

            elapsed = round(time.time() - start_time, 3)

            return QAOAExecutionResult(
                qubits_used=n,
                circuit_depth=circuit_depth,
                gate_count=gate_count,
                optimization_iterations=opt_res.nfev,
                best_cost=round(best_cost, 2),
                execution_time_sec=elapsed,
                best_bitstring=best_bitstring,
                top_candidates=top_candidates,
                circuit_ascii=f"QAOA (p={self.p_layers}, Qubits={n}, AerSimulator)",
                optimized_timings=timings,
                quantum_executed=True,
                fallback_active=False,
                status_message="QAOA executed successfully on Qiskit Aer simulator."
            )

        except Exception as e:
            return self._classical_fallback(
                Q, var_labels, constant_offset, qubo_engine,
                f"Quantum execution error ({str(e)}) — classical fallback active."
            )

    def _classical_fallback(
        self,
        Q: np.ndarray,
        var_labels: List[str],
        constant_offset: float,
        qubo_engine: Any,
        message: str
    ) -> QAOAExecutionResult:
        """
        Graceful classical simulated annealing / greedy fallback when quantum fails.
        """
        start_time = time.time()
        n = len(var_labels)
        best_x = np.zeros(n, dtype=int)
        # Choose valid one-hot per intersection
        for i in range(0, n, 2):
            best_x[i] = 1  # default NS

        best_cost = qubo_engine.evaluate_cost(best_x, Q, constant_offset)
        best_bits = "".join(str(b) for b in best_x)

        # Quick greedy neighborhood search
        for i in range(0, n, 2):
            test_x = best_x.copy()
            test_x[i] = 0
            test_x[i + 1] = 1
            cost = qubo_engine.evaluate_cost(test_x, Q, constant_offset)
            if cost < best_cost:
                best_cost = cost
                best_x = test_x
                best_bits = "".join(str(b) for b in best_x)

        timings = qubo_engine.decode_solution(best_bits, var_labels)
        elapsed = round(time.time() - start_time, 3)

        return QAOAExecutionResult(
            qubits_used=n,
            circuit_depth=0,
            gate_count={"classical": 1},
            optimization_iterations=10,
            best_cost=round(best_cost, 2),
            execution_time_sec=elapsed,
            best_bitstring=best_bits,
            top_candidates=[{"bitstring": best_bits, "probability": 1.0, "cost": round(best_cost, 2), "count": 100}],
            circuit_ascii="Classical Fallback Mode",
            optimized_timings=timings,
            quantum_executed=False,
            fallback_active=True,
            status_message=message
        )

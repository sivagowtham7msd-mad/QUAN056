import sys
from backend.network_model import TrafficNetwork
from backend.traffic_engine import TrafficEngine
from backend.qubo_engine import QUBOEngine, OptimizationWeights
from backend.quantum_optimizer import QuantumOptimizer
from backend.classical_optimizer import ClassicalOptimizer

def test_full_pipeline():
    print("1. Initializing Traffic Network...")
    net = TrafficNetwork()
    assert len(net.nodes) == 6, f"Expected 6 nodes, got {len(net.nodes)}"
    assert len(net.roads) == 14, f"Expected 14 directed roads, got {len(net.roads)}"
    print("-> Network OK. 6 nodes, 14 directed roads.")

    print("\n2. Initializing Simulation Engine...")
    eng = TrafficEngine(net)
    eng.start()
    for _ in range(20):
        eng.step(0.1)
    print(f"-> Simulation stepped. Active vehicles: {len(eng.vehicles)}, Sim time: {eng.sim_time:.1f}s")

    print("\n3. Testing Classical Optimizer...")
    classical = ClassicalOptimizer()
    c_res = classical.optimize_rule_based(net.nodes)
    print(f"-> Classical rule-based result: {c_res.method}, time: {c_res.execution_time_sec}s, cost: {c_res.total_cost}")

    print("\n4. Testing QUBO Formulation...")
    qubo = QUBOEngine()
    weights = OptimizationWeights()
    Q, labels, meta = qubo.build_qubo(net.nodes, net.roads, weights)
    assert Q.shape == (12, 12), f"Expected 12x12 QUBO, got {Q.shape}"
    print(f"-> QUBO matrix constructed: {Q.shape}, variables: {labels[:4]}..., constant: {meta['constant_offset']}")

    print("\n5. Testing QAOA on Qiskit Aer Simulator...")
    q_opt = QuantumOptimizer(p_layers=1, shots=256)
    q_res = q_opt.optimize_traffic(Q, labels, meta["constant_offset"], qubo, maxiter=5)
    print(f"-> QAOA finished!")
    print(f"   Qubits used: {q_res.qubits_used}")
    print(f"   Circuit depth: {q_res.circuit_depth}")
    print(f"   Iterations: {q_res.optimization_iterations}")
    print(f"   Execution time: {q_res.execution_time_sec}s")
    print(f"   Best bitstring: {q_res.best_bitstring}")
    print(f"   Best cost: {q_res.best_cost}")
    print(f"   Quantum executed: {q_res.quantum_executed}")

    print("\n6. Testing Emergency Green Corridor...")
    ev = eng.emergency_engine.spawn_emergency("I1", "I6")
    assert ev is not None, "Failed to spawn emergency vehicle"
    print(f"-> Emergency vehicle spawned! Path: {' -> '.join(ev.path)}")
    print(f"   Normal ETA: {ev.normal_eta_sec}s, Optimized ETA: {ev.optimized_eta_sec}s, Saved: {ev.time_saved_sec}s")
    for _ in range(15):
        eng.step(0.5)
    print(f"-> Ambulance progress: {ev.progress:.2f}, Active: {ev.is_active}, Completed: {ev.completed}")

    print("\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_full_pipeline()

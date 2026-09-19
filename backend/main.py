import asyncio
import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.network_model import TrafficNetwork
from backend.traffic_engine import TrafficEngine
from backend.qubo_engine import QUBOEngine, OptimizationWeights
from backend.quantum_optimizer import QuantumOptimizer, QAOAExecutionResult
from backend.classical_optimizer import ClassicalOptimizer, ClassicalOptimizationResult

app = FastAPI(
    title="QuantumFlow API",
    description="Hybrid Quantum-Classical Urban Traffic Optimization Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singleton instances
network = TrafficNetwork()
engine = TrafficEngine(network)
qubo_engine = QUBOEngine()
quantum_optimizer = QuantumOptimizer(p_layers=1, shots=512)
classical_optimizer = ClassicalOptimizer()

# Active WebSocket connections
connected_websockets: list[WebSocket] = []

class DemandRequest(BaseModel):
    level: str  # LOW, MEDIUM, HIGH, EXTREME
    ns_bias: float = 1.0
    ew_bias: float = 1.0

class PresetRequest(BaseModel):
    preset: str

class CongestionRequest(BaseModel):
    intersection_id: str

class RoadEventRequest(BaseModel):
    road_id: str

class EmergencySpawnRequest(BaseModel):
    origin: str = "I1"
    destination: str = "I6"

class OptimizationWeightsRequest(BaseModel):
    w_waiting_time: float = 1.0
    w_queue: float = 1.2
    w_congestion: float = 0.8
    w_emissions: float = 0.6
    w_emergency: float = 3.5
    penalty_multiplier: float = 15.0

# ----------------- Background Simulation Loop -----------------
async def simulation_loop():
    """Ticks the simulation engine and pushes updates to WebSockets."""
    dt = 0.1  # 10 ticks per second
    while True:
        try:
            if engine.is_running:
                state = engine.step(dt)
                if connected_websockets:
                    state_json = state.model_dump()
                    disconnected = []
                    for ws in connected_websockets:
                        try:
                            await ws.send_json({"type": "STATE_UPDATE", "data": state_json})
                        except Exception:
                            disconnected.append(ws)
                    for ws in disconnected:
                        if ws in connected_websockets:
                            connected_websockets.remove(ws)
            await asyncio.sleep(dt)
        except Exception as e:
            print("Error in simulation loop:", e)
            await asyncio.sleep(dt)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

# ----------------- WebSocket -----------------
@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        # Send initial state
        await websocket.send_json({"type": "STATE_UPDATE", "data": engine.get_state().model_dump()})
        while True:
            # Keep-alive / message listener
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
    except Exception:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

# ----------------- REST Endpoints -----------------
@app.get("/api/health")
async def get_health():
    return {
        "status": "online",
        "engines": {
            "traffic_simulator": "online" if engine.is_running else "ready",
            "network_engine": "online",
            "classical_optimizer": "online",
            "qubo_engine": "online",
            "qaoa_engine": "online" if quantum_optimizer.simulator is not None else "degraded",
            "emergency_engine": "online",
            "metrics_engine": "online"
        },
        "qiskit_available": quantum_optimizer.simulator is not None
    }

@app.get("/api/network")
async def get_network():
    return network.to_dict()

@app.get("/api/simulation/state")
async def get_simulation_state():
    return engine.get_state().model_dump()

@app.post("/api/simulation/start")
async def start_simulation():
    engine.start()
    return {"status": "started", "sim_time": engine.sim_time}

@app.post("/api/simulation/pause")
async def pause_simulation():
    engine.pause()
    return {"status": "paused", "sim_time": engine.sim_time}

@app.post("/api/simulation/reset")
async def reset_simulation():
    engine.reset()
    return {"status": "reset", "sim_time": 0.0}

@app.post("/api/simulation/demand")
async def set_demand(req: DemandRequest):
    engine.set_demand(req.level, req.ns_bias, req.ew_bias)
    return {"status": "updated", "demand_level": engine.demand_level}

@app.post("/api/simulation/preset")
async def apply_preset(req: PresetRequest):
    engine.apply_preset(req.preset)
    return {"status": "applied", "preset": req.preset}

@app.post("/api/events/congestion")
async def trigger_congestion(req: CongestionRequest):
    if req.intersection_id not in network.nodes:
        raise HTTPException(status_code=404, detail="Intersection not found")
    engine.trigger_congestion(req.intersection_id)
    return {"status": "congestion_triggered", "intersection": req.intersection_id}

@app.post("/api/events/accident")
async def trigger_accident(req: RoadEventRequest):
    if req.road_id not in network.roads:
        raise HTTPException(status_code=404, detail="Road segment not found")
    engine.trigger_accident(req.road_id)
    return {"status": "accident_triggered", "road": req.road_id}

@app.post("/api/events/road-closure")
async def trigger_road_closure(req: RoadEventRequest):
    if req.road_id not in network.roads:
        raise HTTPException(status_code=404, detail="Road segment not found")
    engine.trigger_road_closure(req.road_id)
    return {"status": "road_closed", "road": req.road_id}

@app.post("/api/events/clear")
async def clear_events():
    engine.clear_events()
    return {"status": "events_cleared"}

@app.post("/api/emergency/spawn")
async def spawn_emergency(req: EmergencySpawnRequest):
    if req.origin not in network.nodes or req.destination not in network.nodes:
        raise HTTPException(status_code=400, detail="Invalid origin or destination node")
    ev = engine.emergency_engine.spawn_emergency(req.origin, req.destination)
    if not ev:
        raise HTTPException(status_code=400, detail="Could not find reachable route for emergency vehicle")
    return {"status": "emergency_spawned", "vehicle": ev.model_dump()}

@app.post("/api/emergency/clear")
async def clear_emergency():
    engine.emergency_engine.clear()
    return {"status": "emergency_cleared"}

@app.post("/api/optimize/classical")
async def optimize_classical():
    """Runs classical rule-based adaptive optimization and applies timings."""
    kpis_before = engine.metrics_engine.last_kpis.model_dump()
    res = classical_optimizer.optimize_rule_based(network.nodes)

    # Apply timings to network
    for node_id, timing in res.optimized_timings.items():
        if node_id in network.nodes:
            network.nodes[node_id].green_duration_ns = timing["green_ns"]
            network.nodes[node_id].green_duration_ew = timing["green_ew"]

    # Record comparison benchmark
    engine.metrics_engine.record_comparison(
        mode="Classical Baseline",
        kpis=engine.metrics_engine.last_kpis,
        opt_cost=res.total_cost,
        exec_time=res.execution_time_sec,
        timestamp=engine.sim_time
    )

    return {
        "type": "CLASSICAL",
        "result": res.model_dump(),
        "before_kpis": kpis_before,
        "applied_timings": res.optimized_timings
    }

@app.post("/api/optimize/quantum")
@app.post("/api/optimize/hybrid")
async def optimize_hybrid(weights: Optional[OptimizationWeightsRequest] = None):
    """
    Runs full Hybrid Quantum-Classical pipeline:
    Traffic State -> QUBO -> Ising Hamiltonian -> QAOA on AerSimulator -> Measurement & Decoding -> Apply Timings
    """
    kpis_before = engine.metrics_engine.last_kpis.model_dump()

    w = OptimizationWeights(
        w_waiting_time=weights.w_waiting_time if weights else 1.0,
        w_queue=weights.w_queue if weights else 1.2,
        w_congestion=weights.w_congestion if weights else 0.8,
        w_emissions=weights.w_emissions if weights else 0.6,
        w_emergency=weights.w_emergency if weights else 3.5,
        penalty_multiplier=weights.penalty_multiplier if weights else 15.0
    )

    # Check emergency path if active
    em_path = None
    if engine.emergency_engine.active_emergency and engine.emergency_engine.active_emergency.is_active:
        em_path = engine.emergency_engine.active_emergency.path

    # 1. Build QUBO
    Q, var_labels, meta = qubo_engine.build_qubo(
        nodes=network.nodes,
        roads=network.roads,
        weights=w,
        emergency_path=em_path
    )

    # 2. Run QAOA Optimization on Qiskit Aer
    res: QAOAExecutionResult = quantum_optimizer.optimize_traffic(
        Q=Q,
        var_labels=var_labels,
        constant_offset=meta["constant_offset"],
        qubo_engine=qubo_engine,
        maxiter=15
    )

    # 3. Apply decoded timings
    for node_id, timing in res.optimized_timings.items():
        if node_id in network.nodes:
            network.nodes[node_id].green_duration_ns = timing["green_ns"]
            network.nodes[node_id].green_duration_ew = timing["green_ew"]

    # 4. Record comparison benchmark
    em_travel_time = engine.emergency_engine.active_emergency.optimized_eta_sec if engine.emergency_engine.active_emergency else None
    engine.metrics_engine.record_comparison(
        mode="Hybrid Quantum-Classical",
        kpis=engine.metrics_engine.last_kpis,
        opt_cost=res.best_cost,
        exec_time=res.execution_time_sec,
        timestamp=engine.sim_time,
        emergency_travel_time=em_travel_time
    )

    return {
        "type": "HYBRID_QUANTUM_CLASSICAL",
        "result": res.model_dump(),
        "qubo_meta": {
            "num_variables": meta["num_variables"],
            "variable_labels": meta["variable_labels"],
            "constant_offset": meta["constant_offset"],
            "matrix_preview": Q[:6, :6].tolist()  # Preview of top-left 6x6
        },
        "before_kpis": kpis_before,
        "applied_timings": res.optimized_timings
    }

@app.get("/api/metrics")
async def get_metrics():
    return {
        "kpis": engine.metrics_engine.last_kpis.model_dump(),
        "history": [pt.model_dump() for pt in engine.metrics_engine.history]
    }

@app.get("/api/comparison")
async def get_comparison():
    return engine.metrics_engine.get_comparison()

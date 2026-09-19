import time
import random
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from backend.network_model import TrafficNetwork
from backend.emergency_engine import EmergencyEngine, EmergencyVehicle
from backend.metrics_engine import MetricsEngine, SystemKPIs

class Vehicle(BaseModel):
    id: str
    origin: str
    destination: str
    path: List[str]
    current_edge_index: int = 0
    current_road_id: str
    progress: float = 0.0  # 0.0 to 1.0 along current road
    speed: float = 12.0  # m/s
    waiting_time: float = 0.0
    is_queued: bool = False
    is_emergency: bool = False
    color: str = "#38BDF8"  # cyan/blue default

class SimulationState(BaseModel):
    is_running: bool = False
    sim_time: float = 0.0
    demand_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH, EXTREME
    demand_ns: float = 1.0
    demand_ew: float = 1.0
    vehicles: List[Vehicle]
    active_events: List[Dict[str, Any]] = Field(default_factory=list)
    emergency_vehicle: Optional[EmergencyVehicle] = None
    kpis: SystemKPIs
    network: Dict[str, Any]

class TrafficEngine:
    """
    Core microscopic simulation engine modeling vehicle movements, queues,
    traffic signal dynamics, and scenario events.
    """
    def __init__(self, network: TrafficNetwork):
        self.network = network
        self.emergency_engine = EmergencyEngine(self.network)
        self.metrics_engine = MetricsEngine()

        self.vehicles: Dict[str, Vehicle] = {}
        self.is_running: bool = False
        self.sim_time: float = 0.0
        self.vehicle_counter: int = 0
        self.total_completed: int = 0

        # Demand parameters
        self.demand_level: str = "MEDIUM"
        self.demand_ns: float = 1.0
        self.demand_ew: float = 1.0
        self.spawn_interval: float = 0.8  # seconds between spawns
        self.time_since_spawn: float = 0.0

        self.active_events: List[Dict[str, Any]] = []

    def start(self):
        self.is_running = True

    def pause(self):
        self.is_running = False

    def reset(self):
        self.vehicles.clear()
        self.emergency_engine.clear()
        self.sim_time = 0.0
        self.vehicle_counter = 0
        self.total_completed = 0
        self.active_events.clear()
        # Reset all roads and nodes
        for road in self.network.roads.values():
            road.status = "NORMAL"
            road.current_density = 0.0
            road.vehicle_count = 0
            road.active_corridor = False
            self.network.update_road_weight(road.id)

        for node in self.network.nodes.values():
            node.queue_ns = 0
            node.queue_ew = 0
            node.current_phase = "NS"
            node.phase_remaining = node.green_duration_ns
            node.signal_state = {"NS": "GREEN", "EW": "RED"}
            node.is_corridor = False

        self.metrics_engine = MetricsEngine()

    def set_demand(self, level: str, ns_bias: float = 1.0, ew_bias: float = 1.0):
        self.demand_level = level.upper()
        self.demand_ns = max(0.2, min(3.0, ns_bias))
        self.demand_ew = max(0.2, min(3.0, ew_bias))

        rates = {
            "LOW": 1.6,
            "MEDIUM": 0.8,
            "HIGH": 0.4,
            "EXTREME": 0.2
        }
        self.spawn_interval = rates.get(self.demand_level, 0.8)

    def trigger_congestion(self, intersection_id: str):
        """Simulates sudden traffic buildup at an intersection."""
        if intersection_id not in self.network.nodes:
            return
        node = self.network.nodes[intersection_id]
        # Inject vehicles heading to this intersection
        inbound = node.inbound_roads
        for road_id in inbound:
            for _ in range(3):
                road = self.network.roads[road_id]
                self._spawn_specific_vehicle(road.source, road.target)

        self.active_events.append({
            "type": "CONGESTION",
            "target": intersection_id,
            "description": f"Congestion surge at {node.name}"
        })

    def trigger_accident(self, road_id: str):
        """Blocks road due to accident and triggers vehicle rerouting."""
        if road_id in self.network.roads:
            self.network.set_road_status(road_id, "ACCIDENT")
            self.active_events.append({
                "type": "ACCIDENT",
                "target": road_id,
                "description": f"Traffic accident on {road_id}"
            })
            self._reroute_affected_vehicles(road_id)

    def trigger_road_closure(self, road_id: str):
        """Completely disables a road segment."""
        if road_id in self.network.roads:
            self.network.set_road_status(road_id, "CLOSED")
            self.active_events.append({
                "type": "ROAD_CLOSURE",
                "target": road_id,
                "description": f"Road closure on {road_id}"
            })
            self._reroute_affected_vehicles(road_id)

    def clear_events(self):
        for road in self.network.roads.values():
            road.status = "NORMAL"
            self.network.update_road_weight(road.id)
        self.active_events.clear()

    def _reroute_affected_vehicles(self, blocked_road_id: str):
        for v in list(self.vehicles.values()):
            if blocked_road_id in v.path:
                curr_road = self.network.roads.get(v.current_road_id)
                if curr_road:
                    new_path = self.network.get_shortest_path(curr_road.target, v.destination)
                    if new_path and len(new_path) > 1:
                        v.path = [curr_road.source] + new_path
                        v.current_edge_index = 0

    def apply_preset(self, preset_name: str):
        """Applies demo scenario presets."""
        self.reset()
        name = preset_name.lower().strip()

        if name == "normal city":
            self.set_demand("MEDIUM", 1.0, 1.0)
            self.start()
        elif name == "rush hour":
            self.set_demand("EXTREME", 1.5, 1.5)
            self.start()
            # Spawn immediate initial wave
            for _ in range(15):
                self._spawn_random_vehicle()
        elif name == "accident":
            self.set_demand("HIGH", 1.2, 1.2)
            self.start()
            for _ in range(10):
                self._spawn_random_vehicle()
            self.trigger_accident("I2->I5")
        elif name == "emergency":
            self.set_demand("MEDIUM", 1.0, 1.0)
            self.start()
            for _ in range(8):
                self._spawn_random_vehicle()
            self.emergency_engine.spawn_emergency("I1", "I6")
        elif name == "rush hour + emergency":
            self.set_demand("EXTREME", 1.4, 1.4)
            self.start()
            for _ in range(16):
                self._spawn_random_vehicle()
            self.emergency_engine.spawn_emergency("I1", "I6")
        elif name == "road closure + emergency":
            self.set_demand("HIGH", 1.0, 1.0)
            self.start()
            for _ in range(10):
                self._spawn_random_vehicle()
            self.trigger_road_closure("I2->I5")
            self.emergency_engine.spawn_emergency("I1", "I6")

    def _spawn_random_vehicle(self):
        nodes = list(self.network.nodes.keys())
        if len(nodes) < 2:
            return
        origin = random.choice(nodes)
        dest_choices = [n for n in nodes if n != origin]
        destination = random.choice(dest_choices)

        path = self.network.get_shortest_path(origin, destination)
        if not path or len(path) < 2:
            return

        road_id = self.network.get_road_id(path[0], path[1])
        if not road_id or self.network.roads[road_id].status in ("CLOSED", "ACCIDENT"):
            return

        self.vehicle_counter += 1
        v_id = f"V-{self.vehicle_counter}"
        colors = ["#38BDF8", "#818CF8", "#A78BFA", "#34D399", "#FBBF24"]

        self.vehicles[v_id] = Vehicle(
            id=v_id,
            origin=origin,
            destination=destination,
            path=path,
            current_edge_index=0,
            current_road_id=road_id,
            progress=0.0,
            speed=random.uniform(10.0, 14.0),
            color=random.choice(colors)
        )

    def _spawn_specific_vehicle(self, origin: str, destination: str):
        path = self.network.get_shortest_path(origin, destination)
        if not path or len(path) < 2:
            return
        road_id = self.network.get_road_id(path[0], path[1])
        if not road_id:
            return

        self.vehicle_counter += 1
        v_id = f"V-{self.vehicle_counter}"
        self.vehicles[v_id] = Vehicle(
            id=v_id,
            origin=origin,
            destination=destination,
            path=path,
            current_edge_index=0,
            current_road_id=road_id,
            progress=0.0,
            speed=12.0,
            color="#F43F5E"
        )

    def update_signals(self, dt: float):
        """Updates traffic signal countdowns and transitions (GREEN -> YELLOW -> RED)."""
        for node in self.network.nodes.values():
            if node.is_corridor:
                # Corridor signals are managed by EmergencyEngine
                continue

            node.phase_remaining -= dt

            # Transition to YELLOW in last 3 seconds of phase
            if node.phase_remaining <= node.yellow_duration:
                if node.current_phase == "NS":
                    node.signal_state["NS"] = "YELLOW"
                else:
                    node.signal_state["EW"] = "YELLOW"

            # Phase switch when timer expires
            if node.phase_remaining <= 0.0:
                if node.current_phase == "NS":
                    node.current_phase = "EW"
                    node.phase_remaining = node.green_duration_ew
                    node.signal_state = {"NS": "RED", "EW": "GREEN"}
                else:
                    node.current_phase = "NS"
                    node.phase_remaining = node.green_duration_ns
                    node.signal_state = {"NS": "GREEN", "EW": "RED"}

    def step(self, dt: float = 0.1) -> SimulationState:
        """Single simulation integration step."""
        if not self.is_running:
            return self.get_state()

        self.sim_time += dt
        self.time_since_spawn += dt

        # 1. Spawn vehicles based on demand rate
        if self.time_since_spawn >= self.spawn_interval:
            self.time_since_spawn = 0.0
            # Directional spawn bias check
            if random.random() < 0.85:
                self._spawn_random_vehicle()

        # 2. Update traffic signal states
        self.update_signals(dt)

        # 3. Update Emergency Vehicle if active
        emergency_veh = self.emergency_engine.step(dt)

        # 4. Reset intersection queue counters
        for node in self.network.nodes.values():
            node.queue_ns = 0
            node.queue_ew = 0

        # Reset road vehicle counts
        for road in self.network.roads.values():
            road.vehicle_count = 0

        # 5. Move Vehicles
        completed_ids = []

        for v in self.vehicles.values():
            road = self.network.roads.get(v.current_road_id)
            if not road:
                completed_ids.append(v.id)
                continue

            road.vehicle_count += 1

            # Determine road orientation (NS or EW)
            src_node = self.network.nodes[road.source]
            tgt_node = self.network.nodes[road.target]
            is_horizontal = abs(tgt_node.x - src_node.x) > abs(tgt_node.y - src_node.y)
            orientation = "EW" if is_horizontal else "NS"

            # Check if road is blocked
            if road.status in ("CLOSED", "ACCIDENT") and v.progress > 0.4:
                v.speed = 0.0
                v.waiting_time += dt
                v.is_queued = True
                continue

            # Check signal at destination node of current road
            target_signal = tgt_node.signal_state.get(orientation, "RED")

            # Approaching intersection
            dist_to_stop = (1.0 - v.progress) * road.length

            if dist_to_stop < 25.0 and target_signal in ("RED", "YELLOW"):
                # Must stop at red/yellow light
                v.speed = max(0.0, v.speed - 6.0 * dt)
                v.waiting_time += dt
                v.is_queued = True

                # Increment intersection queue count
                if orientation == "NS":
                    tgt_node.queue_ns += 1
                else:
                    tgt_node.queue_ew += 1
            else:
                # Green light or far from intersection -> accelerate to free flow
                v.speed = min(road.speed_limit, v.speed + 3.0 * dt)
                v.is_queued = False

            # Move vehicle
            delta_dist = v.speed * dt
            v.progress += delta_dist / max(road.length, 1.0)

            # Reached intersection
            if v.progress >= 1.0:
                if target_signal == "GREEN" or dist_to_stop < 5.0:
                    # Proceed to next edge
                    v.current_edge_index += 1
                    if v.current_edge_index >= len(v.path) - 1:
                        # Reached final destination
                        completed_ids.append(v.id)
                        tgt_node.total_served += 1
                    else:
                        next_u = v.path[v.current_edge_index]
                        next_v = v.path[v.current_edge_index + 1]
                        next_road_id = self.network.get_road_id(next_u, next_v)
                        if next_road_id and self.network.roads[next_road_id].status not in ("CLOSED", "ACCIDENT"):
                            v.current_road_id = next_road_id
                            v.progress = 0.0
                        else:
                            # Try dynamic reroute
                            reroute = self.network.get_shortest_path(next_u, v.destination)
                            if reroute and len(reroute) > 1:
                                v.path = [road.source, next_u] + reroute[1:]
                                v.current_edge_index = 1
                                v.current_road_id = self.network.get_road_id(reroute[0], reroute[1])
                                v.progress = 0.0
                            else:
                                completed_ids.append(v.id)
                else:
                    # Hold at intersection line
                    v.progress = 0.98
                    v.speed = 0.0
                    v.waiting_time += dt
                    v.is_queued = True
                    if orientation == "NS":
                        tgt_node.queue_ns += 1
                    else:
                        tgt_node.queue_ew += 1

        # Remove completed vehicles
        for v_id in completed_ids:
            if v_id in self.vehicles:
                del self.vehicles[v_id]
                self.total_completed += 1
                self.metrics_engine.log_completed_vehicle(self.sim_time)

        # Update road densities
        for road in self.network.roads.values():
            road.current_density = min(1.0, road.vehicle_count / float(road.capacity))
            self.network.update_road_weight(road.id)

        # 6. Compute KPIs
        eta = emergency_veh.optimized_eta_sec if emergency_veh and emergency_veh.is_active else None
        self.metrics_engine.compute(
            sim_time=self.sim_time,
            vehicles=list(self.vehicles.values()),
            nodes=self.network.nodes,
            total_spawned=self.vehicle_counter,
            total_completed=self.total_completed,
            emergency_eta=eta
        )

        return self.get_state()

    def get_state(self) -> SimulationState:
        return SimulationState(
            is_running=self.is_running,
            sim_time=round(self.sim_time, 1),
            demand_level=self.demand_level,
            demand_ns=self.demand_ns,
            demand_ew=self.demand_ew,
            vehicles=list(self.vehicles.values()),
            active_events=self.active_events,
            emergency_vehicle=self.emergency_engine.active_emergency,
            kpis=self.metrics_engine.last_kpis,
            network=self.network.to_dict()
        )

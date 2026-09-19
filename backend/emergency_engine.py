import time
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class EmergencyVehicle(BaseModel):
    id: str = "EMERGENCY-01"
    origin: str
    destination: str
    current_edge: Optional[str] = None
    progress: float = 0.0  # 0.0 to 1.0 along current edge
    current_node_index: int = 0
    path: List[str] = Field(default_factory=list)
    speed: float = 16.0  # m/s (~58 km/h, faster than normal traffic)
    is_active: bool = False
    completed: bool = False
    spawn_time: float = 0.0
    elapsed_time: float = 0.0
    normal_eta_sec: float = 120.0
    optimized_eta_sec: float = 48.0
    time_saved_sec: float = 0.0
    affected_intersections: List[str] = Field(default_factory=list)

class EmergencyEngine:
    """
    Manages dynamic Emergency Green Corridor, route planning, signal preemption,
    and vehicle tracking to destination.
    """
    def __init__(self, network: Any):
        self.network = network
        self.active_emergency: Optional[EmergencyVehicle] = None
        self.preempted_signals_backup: Dict[str, Dict[str, Any]] = {}

    def spawn_emergency(self, origin: str = "I1", destination: str = "I6") -> Optional[EmergencyVehicle]:
        """
        Spawns emergency vehicle and calculates dynamic green corridor route.
        """
        if origin not in self.network.nodes or destination not in self.network.nodes:
            return None

        # Calculate shortest path avoiding accidents and closures
        path = self.network.get_shortest_path(origin, destination)
        if not path or len(path) < 2:
            return None

        # Calculate ETAs
        total_distance = 0.0
        normal_intersections_delay = 0.0

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            road_id = self.network.get_road_id(u, v)
            if road_id and road_id in self.network.roads:
                road = self.network.roads[road_id]
                total_distance += road.length
                # Without green corridor, average wait per red light is ~25s
                normal_intersections_delay += 25.0

        ambulance_speed = 16.0  # m/s
        transit_time = total_distance / ambulance_speed
        normal_eta = round(transit_time + normal_intersections_delay, 1)
        optimized_eta = round(transit_time + 4.0, 1)  # Minimal 4s delay with green corridor
        time_saved = round(normal_eta - optimized_eta, 1)

        first_road = self.network.get_road_id(path[0], path[1])

        self.active_emergency = EmergencyVehicle(
            origin=origin,
            destination=destination,
            current_edge=first_road,
            progress=0.0,
            current_node_index=0,
            path=path,
            speed=ambulance_speed,
            is_active=True,
            completed=False,
            spawn_time=time.time(),
            elapsed_time=0.0,
            normal_eta_sec=normal_eta,
            optimized_eta_sec=optimized_eta,
            time_saved_sec=time_saved,
            affected_intersections=path
        )

        # Mark corridor roads and activate preemption
        self._activate_corridor_signals(path)
        return self.active_emergency

    def _activate_corridor_signals(self, path: List[str]):
        """Preempts signals along emergency path to prioritize oncoming vehicle."""
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            road_id = self.network.get_road_id(u, v)
            if road_id and road_id in self.network.roads:
                self.network.roads[road_id].active_corridor = True

        # Preempt nodes
        for i, node_id in enumerate(path):
            if node_id in self.network.nodes:
                node = self.network.nodes[node_id]
                node.is_corridor = True

                # Determine direction through this intersection
                direction = "NS"
                if i < len(path) - 1:
                    nxt = path[i + 1]
                    n_curr = self.network.nodes[node_id]
                    n_nxt = self.network.nodes[nxt]
                    if abs(n_nxt.x - n_curr.x) > abs(n_nxt.y - n_curr.y):
                        direction = "EW"
                elif i > 0:
                    prev = path[i - 1]
                    n_prev = self.network.nodes[prev]
                    n_curr = self.network.nodes[node_id]
                    if abs(n_curr.x - n_prev.x) > abs(n_prev.y - n_curr.y):
                        direction = "EW"

                # Preempt signal immediately to green in corridor direction
                if direction == "NS":
                    node.current_phase = "NS"
                    node.signal_state = {"NS": "GREEN", "EW": "RED"}
                    node.phase_remaining = 60.0  # extended green
                else:
                    node.current_phase = "EW"
                    node.signal_state = {"NS": "RED", "EW": "GREEN"}
                    node.phase_remaining = 60.0

    def step(self, dt: float) -> Optional[EmergencyVehicle]:
        """Steps emergency vehicle position along route."""
        if not self.active_emergency or not self.active_emergency.is_active:
            return None

        em = self.active_emergency
        em.elapsed_time += dt

        path = em.path
        curr_idx = em.current_node_index

        if curr_idx >= len(path) - 1:
            # Reached destination!
            em.completed = True
            em.is_active = False
            self._deactivate_corridor(path)
            return em

        u = path[curr_idx]
        v = path[curr_idx + 1]
        road_id = self.network.get_road_id(u, v)

        if not road_id or road_id not in self.network.roads:
            em.completed = True
            em.is_active = False
            self._deactivate_corridor(path)
            return em

        road = self.network.roads[road_id]
        dist_step = em.speed * dt
        progress_delta = dist_step / max(road.length, 1.0)
        em.progress += progress_delta

        if em.progress >= 1.0:
            # Advance to next intersection
            em.current_node_index += 1
            if em.current_node_index >= len(path) - 1:
                # Reached final destination!
                em.completed = True
                em.is_active = False
                em.progress = 1.0
                self._deactivate_corridor(path)
            else:
                em.progress = 0.0
                next_u = path[em.current_node_index]
                next_v = path[em.current_node_index + 1]
                em.current_edge = self.network.get_road_id(next_u, next_v)

        return em

    def _deactivate_corridor(self, path: List[str]):
        """Restores normal operation after emergency vehicle completes journey."""
        for road in self.network.roads.values():
            road.active_corridor = False

        for node_id in path:
            if node_id in self.network.nodes:
                self.network.nodes[node_id].is_corridor = False
                self.network.nodes[node_id].phase_remaining = 15.0

    def clear(self):
        if self.active_emergency:
            self._deactivate_corridor(self.active_emergency.path)
            self.active_emergency = None

import networkx as nx
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

class RoadSegment(BaseModel):
    id: str
    source: str
    target: str
    length: float = 300.0  # meters
    speed_limit: float = 14.0  # m/s (~50 km/h)
    capacity: int = 25
    current_density: float = 0.0  # 0.0 to 1.0
    status: str = "NORMAL"  # NORMAL, CONGESTED, ACCIDENT, CLOSED
    vehicle_count: int = 0
    active_corridor: bool = False

class IntersectionNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    current_phase: str = "NS"  # "NS" (North-South) or "EW" (East-West)
    phase_remaining: float = 30.0
    green_duration_ns: float = 30.0
    green_duration_ew: float = 30.0
    yellow_duration: float = 3.0
    signal_state: Dict[str, str] = Field(default_factory=lambda: {"NS": "GREEN", "EW": "RED"})
    queue_ns: int = 0
    queue_ew: int = 0
    total_served: int = 0
    inbound_roads: List[str] = Field(default_factory=list)
    outbound_roads: List[str] = Field(default_factory=list)
    is_corridor: bool = False

class TrafficNetwork:
    """
    Graph-based 6-intersection urban network model using NetworkX.
    Intersections:
      I1 --- I2 --- I3
      |      |      |
      I4 --- I5 --- I6
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes: Dict[str, IntersectionNode] = {}
        self.roads: Dict[str, RoadSegment] = {}
        self._initialize_network()

    def _initialize_network(self):
        # 6 intersections layout
        coords = {
            "I1": ("Tech Gateway", 160.0, 140.0),
            "I2": ("Downtown Center", 450.0, 140.0),
            "I3": ("Financial Hub", 740.0, 140.0),
            "I4": ("West Boulevard", 160.0, 380.0),
            "I5": ("Central Transit", 450.0, 380.0),
            "I6": ("East Metro Hospital", 740.0, 380.0),
        }

        for node_id, (name, x, y) in coords.items():
            self.nodes[node_id] = IntersectionNode(
                id=node_id,
                name=name,
                x=x,
                y=y,
                current_phase="NS",
                phase_remaining=30.0,
                green_duration_ns=30.0,
                green_duration_ew=30.0,
                signal_state={"NS": "GREEN", "EW": "RED"}
            )
            self.graph.add_node(node_id, name=name, pos=(x, y))

        # Bidirectional connections between adjacent intersections
        edges = [
            ("I1", "I2"), ("I2", "I3"),
            ("I4", "I5"), ("I5", "I6"),
            ("I1", "I4"), ("I2", "I5"), ("I3", "I6")
        ]

        for u, v in edges:
            self._add_bidirectional_road(u, v)

    def _add_bidirectional_road(self, u: str, v: str, length: float = 300.0):
        # Forward road
        road_fwd_id = f"{u}->{v}"
        self.roads[road_fwd_id] = RoadSegment(id=road_fwd_id, source=u, target=v, length=length)
        self.graph.add_edge(u, v, id=road_fwd_id, weight=length / 14.0, length=length)
        self.nodes[u].outbound_roads.append(road_fwd_id)
        self.nodes[v].inbound_roads.append(road_fwd_id)

        # Reverse road
        road_rev_id = f"{v}->{u}"
        self.roads[road_rev_id] = RoadSegment(id=road_rev_id, source=v, target=u, length=length)
        self.graph.add_edge(v, u, id=road_rev_id, weight=length / 14.0, length=length)
        self.nodes[v].outbound_roads.append(road_rev_id)
        self.nodes[u].inbound_roads.append(road_rev_id)

    def get_road_id(self, source: str, target: str) -> Optional[str]:
        road_id = f"{source}->{target}"
        return road_id if road_id in self.roads else None

    def update_road_weight(self, road_id: str):
        if road_id not in self.roads:
            return
        road = self.roads[road_id]
        if road.status == "CLOSED" or road.status == "ACCIDENT":
            cost = 999999.0
        elif road.status == "CONGESTED":
            cost = (road.length / road.speed_limit) * (1.0 + 3.0 * road.current_density)
        else:
            cost = (road.length / road.speed_limit) * (1.0 + 0.8 * road.current_density)

        if self.graph.has_edge(road.source, road.target):
            self.graph[road.source][road.target]["weight"] = cost

    def get_shortest_path(self, origin: str, destination: str) -> List[str]:
        """Calculates shortest available path using NetworkX Dijkstra."""
        try:
            path = nx.shortest_path(self.graph, source=origin, target=destination, weight="weight")
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def set_road_status(self, road_id: str, status: str):
        if road_id in self.roads:
            self.roads[road_id].status = status
            self.update_road_weight(road_id)

    def to_dict(self) -> dict:
        return {
            "nodes": {k: v.model_dump() for k, v in self.nodes.items()},
            "roads": {k: v.model_dump() for k, v in self.roads.items()}
        }

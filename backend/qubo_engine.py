import numpy as np
from typing import Dict, List, Tuple, Any
from pydantic import BaseModel

class OptimizationWeights(BaseModel):
    w_waiting_time: float = 1.0
    w_queue: float = 1.2
    w_congestion: float = 0.8
    w_emissions: float = 0.6
    w_emergency: float = 3.5  # High priority when emergency vehicle active
    penalty_multiplier: float = 15.0

class TimingOption(BaseModel):
    name: str
    green_ns: float
    green_ew: float

# Available timing options per intersection
DEFAULT_TIMING_OPTIONS = [
    TimingOption(name="NS_Priority", green_ns=42.0, green_ew=18.0),
    TimingOption(name="EW_Priority", green_ns=18.0, green_ew=42.0),
]

class QUBOResult(BaseModel):
    num_variables: int
    matrix: List[List[float]]
    variable_labels: List[str]
    linear_terms: Dict[str, float]
    quadratic_terms: Dict[str, float]
    constant_offset: float

class QUBOEngine:
    """
    Formulates the traffic signal coordination problem as a Quadratic Unconstrained Binary Optimization (QUBO) problem:
        min x^T Q x + c
    subject to:
        sum_k x_{i,k} = 1 for each intersection i (one-hot constraint)
    """
    def __init__(self, timing_options: List[TimingOption] = None):
        self.timing_options = timing_options or DEFAULT_TIMING_OPTIONS
        self.num_options = len(self.timing_options)

    def build_qubo(
        self,
        nodes: Dict[str, Any],
        roads: Dict[str, Any],
        weights: OptimizationWeights,
        emergency_path: List[str] = None
    ) -> Tuple[np.ndarray, List[str], Dict[str, Any]]:
        """
        Builds the QUBO matrix Q from current traffic state.
        Variables: x_{i, k} where i is intersection, k is timing option index.
        """
        intersection_ids = sorted(list(nodes.keys()))
        num_intersections = len(intersection_ids)
        num_vars = num_intersections * self.num_options

        # Labels for variables
        var_labels = []
        var_to_index = {}
        idx = 0
        for i_id in intersection_ids:
            for k, opt in enumerate(self.timing_options):
                lbl = f"{i_id}_{opt.name}"
                var_labels.append(lbl)
                var_to_index[(i_id, k)] = idx
                idx += 1

        Q = np.zeros((num_vars, num_vars), dtype=float)
        P = weights.penalty_multiplier
        constant_offset = 0.0

        linear_details = {}
        quadratic_details = {}

        # 1. One-hot Constraint Penalty: P * (sum_k x_{i,k} - 1)^2
        # = P * ( sum_k x_{i,k}^2 + 2 sum_{k<l} x_{i,k} x_{i,l} - 2 sum_k x_{i,k} + 1 )
        # With x^2 = x: = P * ( -sum_k x_{i,k} + 2 sum_{k<l} x_{i,k} x_{i,l} ) + P
        for i_id in intersection_ids:
            constant_offset += P
            for k in range(self.num_options):
                idx_k = var_to_index[(i_id, k)]
                # Linear penalty
                Q[idx_k, idx_k] -= P

                for l in range(k + 1, self.num_options):
                    idx_l = var_to_index[(i_id, l)]
                    # Quadratic penalty between competing options for same intersection
                    Q[idx_k, idx_l] += 2.0 * P
                    quadratic_details[f"{var_labels[idx_k]}:{var_labels[idx_l]}"] = 2.0 * P

        # 2. Objective Function: Cost of each timing option
        emergency_set = set(emergency_path or [])

        for i_id in intersection_ids:
            node = nodes[i_id]
            q_ns = getattr(node, "queue_ns", 0) if hasattr(node, "queue_ns") else node.get("queue_ns", 0)
            q_ew = getattr(node, "queue_ew", 0) if hasattr(node, "queue_ew") else node.get("queue_ew", 0)

            # Determine emergency orientation if node is in emergency path
            is_emergency = i_id in emergency_set
            emergency_dir = None
            if is_emergency and emergency_path and len(emergency_path) > 1:
                curr_idx = emergency_path.index(i_id)
                if curr_idx < len(emergency_path) - 1:
                    nxt = emergency_path[curr_idx + 1]
                    # I1(160, 140), I4(160, 380) -> Vertical (NS)
                    # I1(160, 140), I2(450, 140) -> Horizontal (EW)
                    n_curr = nodes[i_id]
                    n_nxt = nodes[nxt]
                    x_c = getattr(n_curr, "x", 0) if hasattr(n_curr, "x") else n_curr.get("x", 0)
                    y_c = getattr(n_curr, "y", 0) if hasattr(n_curr, "y") else n_curr.get("y", 0)
                    x_n = getattr(n_nxt, "x", 0) if hasattr(n_nxt, "x") else n_nxt.get("x", 0)
                    y_n = getattr(n_nxt, "y", 0) if hasattr(n_nxt, "y") else n_nxt.get("y", 0)

                    if abs(x_n - x_c) > abs(y_n - y_c):
                        emergency_dir = "EW"
                    else:
                        emergency_dir = "NS"

            for k, opt in enumerate(self.timing_options):
                idx_k = var_to_index[(i_id, k)]

                # Model queue dissipation rate (~0.5 vehicle per green second)
                throughput_ns = opt.green_ns * 0.5
                throughput_ew = opt.green_ew * 0.5

                rem_q_ns = max(0.0, q_ns - throughput_ns)
                rem_q_ew = max(0.0, q_ew - throughput_ew)
                total_rem_q = rem_q_ns + rem_q_ew

                # Waiting time estimate: sum of waiting vehicles * red time
                est_wait = (rem_q_ns * opt.green_ew + rem_q_ew * opt.green_ns) * 0.1

                # Congestion score
                congestion = (rem_q_ns / 20.0)**2 + (rem_q_ew / 20.0)**2

                # Fuel and emissions correlate with stops and idle time
                est_fuel = (rem_q_ns + rem_q_ew) * 0.05 + est_wait * 0.01
                est_emissions = est_fuel * 2.3  # kg CO2 / liter approx ratio

                # Emergency delay cost
                emergency_cost = 0.0
                if is_emergency:
                    if emergency_dir == "NS":
                        # If option gives low NS green, heavy penalty
                        emergency_cost = (50.0 - opt.green_ns) * 2.0
                    elif emergency_dir == "EW":
                        emergency_cost = (50.0 - opt.green_ew) * 2.0

                # Total linear cost for variable x_{i, k}
                cost = (
                    weights.w_waiting_time * est_wait +
                    weights.w_queue * total_rem_q +
                    weights.w_congestion * congestion +
                    weights.w_emissions * est_emissions +
                    (weights.w_emergency * emergency_cost if is_emergency else 0.0)
                )

                Q[idx_k, idx_k] += cost
                linear_details[var_labels[idx_k]] = cost

        # 3. Inter-Intersection Coordination (Green Wave Bonus / Penalty)
        # Adjacent intersections coordinated in same direction avoid shockwaves
        adjacent_pairs = [
            ("I1", "I2", "EW"), ("I2", "I3", "EW"),
            ("I4", "I5", "EW"), ("I5", "I6", "EW"),
            ("I1", "I4", "NS"), ("I2", "I5", "NS"), ("I3", "I6", "NS")
        ]

        for u, v, direction in adjacent_pairs:
            # If both have high traffic in that direction, rewarding aligned green reduces cost
            bonus = 3.0
            if direction == "EW":
                idx_u_ew = var_to_index[(u, 1)]  # EW_Priority
                idx_v_ew = var_to_index[(v, 1)]
                # Reward both choosing EW priority (-bonus in QUBO)
                min_idx, max_idx = min(idx_u_ew, idx_v_ew), max(idx_u_ew, idx_v_ew)
                Q[min_idx, max_idx] -= bonus
                quadratic_details[f"{var_labels[min_idx]}:{var_labels[max_idx]}"] = -bonus
            else:
                idx_u_ns = var_to_index[(u, 0)]  # NS_Priority
                idx_v_ns = var_to_index[(v, 0)]
                min_idx, max_idx = min(idx_u_ns, idx_v_ns), max(idx_u_ns, idx_v_ns)
                Q[min_idx, max_idx] -= bonus
                quadratic_details[f"{var_labels[min_idx]}:{var_labels[max_idx]}"] = -bonus

        meta = {
            "num_variables": num_vars,
            "variable_labels": var_labels,
            "constant_offset": constant_offset,
            "linear_terms": linear_details,
            "quadratic_terms": quadratic_details
        }

        return Q, var_labels, meta

    def evaluate_cost(self, x: np.ndarray, Q: np.ndarray, constant: float = 0.0) -> float:
        """Evaluates cost: x^T Q x + constant"""
        return float(x.T @ Q @ x + constant)

    def decode_solution(self, bitstring: str, var_labels: List[str]) -> Dict[str, Dict[str, float]]:
        """
        Decodes a binary solution string (e.g. '100101100101') into intersection signal timings.
        """
        result = {}
        # Ensure bitstring is in standard order
        for i, bit in enumerate(bitstring):
            if i >= len(var_labels):
                break
            label = var_labels[i]
            node_id, opt_name = label.split("_", 1)

            if node_id not in result:
                result[node_id] = {"green_ns": 30.0, "green_ew": 30.0, "selected_option": "Balanced"}

            if bit == "1":
                if "NS_Priority" in opt_name:
                    result[node_id] = {
                        "green_ns": 42.0,
                        "green_ew": 18.0,
                        "selected_option": "NS_Priority"
                    }
                elif "EW_Priority" in opt_name:
                    result[node_id] = {
                        "green_ns": 18.0,
                        "green_ew": 42.0,
                        "selected_option": "EW_Priority"
                    }

        return result

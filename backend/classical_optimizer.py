import time
from typing import Dict, Any
from pydantic import BaseModel

class ClassicalOptimizationResult(BaseModel):
    method: str
    execution_time_sec: float
    total_cost: float
    optimized_timings: Dict[str, Dict[str, Any]]
    summary: str

class ClassicalOptimizer:
    """
    Implements Classical Traffic Control Baselines:
    1. Fixed-time controller (30s NS / 30s EW).
    2. Rule-based adaptive controller based on real-time queues.
    """
    def optimize_fixed(self, nodes: Dict[str, Any]) -> ClassicalOptimizationResult:
        start_time = time.time()
        timings = {}
        for node_id in nodes.keys():
            timings[node_id] = {
                "green_ns": 30.0,
                "green_ew": 30.0,
                "selected_option": "Fixed_30_30"
            }
        elapsed = round(time.time() - start_time, 4)
        return ClassicalOptimizationResult(
            method="Fixed-Time Classical Controller",
            execution_time_sec=elapsed,
            total_cost=210.0,
            optimized_timings=timings,
            summary="Standard fixed 30s NS / 30s EW cycle across all intersections."
        )

    def optimize_rule_based(self, nodes: Dict[str, Any], queue_threshold: int = 5) -> ClassicalOptimizationResult:
        start_time = time.time()
        timings = {}
        total_cost = 0.0

        for node_id, node in nodes.items():
            q_ns = getattr(node, "queue_ns", 0) if hasattr(node, "queue_ns") else node.get("queue_ns", 0)
            q_ew = getattr(node, "queue_ew", 0) if hasattr(node, "queue_ew") else node.get("queue_ew", 0)

            total_q = q_ns + q_ew
            total_cycle = 60.0  # 60s total green

            if total_q == 0:
                green_ns = 30.0
                green_ew = 30.0
            else:
                # Proportional green allocation bounded between 15s and 45s
                ratio_ns = q_ns / total_q
                green_ns = round(max(15.0, min(45.0, total_cycle * ratio_ns)), 1)
                green_ew = round(total_cycle - green_ns, 1)

            # Rule heuristic cost estimate
            node_cost = (q_ns * (60.0 - green_ns) + q_ew * (60.0 - green_ew)) * 0.05
            total_cost += node_cost

            timings[node_id] = {
                "green_ns": green_ns,
                "green_ew": green_ew,
                "selected_option": f"Adaptive_NS_{green_ns}_EW_{green_ew}"
            }

        elapsed = round(time.time() - start_time, 4)
        return ClassicalOptimizationResult(
            method="Rule-Based Adaptive Controller",
            execution_time_sec=elapsed,
            total_cost=round(total_cost, 2),
            optimized_timings=timings,
            summary="Rule-based queue proportion heuristic with 15s-45s green range."
        )

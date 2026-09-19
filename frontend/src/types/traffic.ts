export interface RoadSegment {
  id: string;
  source: string;
  target: string;
  length: number;
  speed_limit: number;
  capacity: number;
  current_density: number;
  status: 'NORMAL' | 'CONGESTED' | 'ACCIDENT' | 'CLOSED';
  vehicle_count: number;
  active_corridor: boolean;
}

export interface IntersectionNode {
  id: string;
  name: string;
  x: number;
  y: number;
  current_phase: 'NS' | 'EW';
  phase_remaining: number;
  green_duration_ns: number;
  green_duration_ew: number;
  yellow_duration: number;
  signal_state: {
    NS: 'GREEN' | 'YELLOW' | 'RED';
    EW: 'GREEN' | 'YELLOW' | 'RED';
  };
  queue_ns: number;
  queue_ew: number;
  total_served: number;
  inbound_roads: string[];
  outbound_roads: string[];
  is_corridor: boolean;
}

export interface Vehicle {
  id: string;
  origin: string;
  destination: string;
  path: string[];
  current_edge_index: number;
  current_road_id: string;
  progress: number;
  speed: number;
  waiting_time: number;
  is_queued: boolean;
  is_emergency: boolean;
  color: string;
}

export interface EmergencyVehicle {
  id: string;
  origin: string;
  destination: string;
  current_edge: string | null;
  progress: number;
  current_node_index: number;
  path: string[];
  speed: number;
  is_active: boolean;
  completed: boolean;
  normal_eta_sec: number;
  optimized_eta_sec: number;
  time_saved_sec: number;
  affected_intersections: string[];
}

export interface SystemKPIs {
  avg_waiting_time: number;
  total_queue: number;
  throughput_per_hr: number;
  fuel_consumption_l_hr: number;
  co2_emissions_kg_hr: number;
  emergency_eta_sec?: number | null;
  active_vehicles: number;
  total_spawned: number;
  total_completed: number;
  disclaimer: string;
}

export interface MetricPoint {
  timestamp: number;
  avg_waiting_time: number;
  total_queue: number;
  throughput_per_hr: number;
  fuel_consumption_l_hr: number;
  co2_emissions_kg_hr: number;
  active_vehicles: number;
}

export interface ComparisonRecord {
  mode: string;
  avg_waiting_time: number;
  max_queue: number;
  total_queue: number;
  throughput_per_hr: number;
  fuel_consumption_l_hr: number;
  co2_emissions_kg_hr: number;
  emergency_travel_time_sec?: number | null;
  optimization_cost: number;
  execution_time_sec: number;
  timestamp: number;
}

export interface CandidateBitstring {
  bitstring: string;
  probability: number;
  cost: number;
  count: number;
}

export interface QAOAResult {
  qubits_used: number;
  circuit_depth: number;
  gate_count: Record<string, number>;
  optimization_iterations: number;
  best_cost: number;
  execution_time_sec: number;
  best_bitstring: string;
  top_candidates: CandidateBitstring[];
  circuit_ascii?: string;
  optimized_timings: Record<string, { green_ns: number; green_ew: number; selected_option: string }>;
  quantum_executed: boolean;
  fallback_active: boolean;
  status_message: string;
}

export interface QUBOMeta {
  num_variables: number;
  variable_labels: string[];
  constant_offset: number;
  matrix_preview: number[][];
}

export interface OptimizationResponse {
  type: 'CLASSICAL' | 'HYBRID_QUANTUM_CLASSICAL';
  result: QAOAResult | {
    method: string;
    execution_time_sec: number;
    total_cost: number;
    optimized_timings: Record<string, { green_ns: number; green_ew: number; selected_option: string }>;
    summary: string;
  };
  qubo_meta?: QUBOMeta;
  before_kpis: SystemKPIs;
  applied_timings: Record<string, { green_ns: number; green_ew: number; selected_option: string }>;
}

export interface SimulationState {
  is_running: boolean;
  sim_time: number;
  demand_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  demand_ns: number;
  demand_ew: number;
  vehicles: Vehicle[];
  active_events: Array<{ type: string; target: string; description: string }>;
  emergency_vehicle: EmergencyVehicle | null;
  kpis: SystemKPIs;
  network: {
    nodes: Record<string, IntersectionNode>;
    roads: Record<string, RoadSegment>;
  };
}

export interface SystemHealth {
  status: string;
  engines: Record<string, string>;
  qiskit_available: boolean;
}

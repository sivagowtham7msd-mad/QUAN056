import { 
  SimulationState, 
  OptimizationResponse, 
  SystemHealth, 
  ComparisonRecord, 
  MetricPoint 
} from '../types/traffic';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getState(): Promise<SimulationState> {
    const res = await fetch(`${API_BASE}/simulation/state`);
    if (!res.ok) throw new Error('Failed to fetch simulation state');
    return res.json();
  },

  async start(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async pause(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  async reset(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return res.json();
  },

  async setDemand(level: string, ns_bias = 1.0, ew_bias = 1.0) {
    const res = await fetch(`${API_BASE}/simulation/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, ns_bias, ew_bias }),
    });
    return res.json();
  },

  async applyPreset(preset: string) {
    const res = await fetch(`${API_BASE}/simulation/preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });
    return res.json();
  },

  async triggerCongestion(intersection_id: string) {
    const res = await fetch(`${API_BASE}/events/congestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intersection_id }),
    });
    return res.json();
  },

  async triggerAccident(road_id: string) {
    const res = await fetch(`${API_BASE}/events/accident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ road_id }),
    });
    return res.json();
  },

  async triggerRoadClosure(road_id: string) {
    const res = await fetch(`${API_BASE}/events/road-closure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ road_id }),
    });
    return res.json();
  },

  async clearEvents() {
    const res = await fetch(`${API_BASE}/events/clear`, { method: 'POST' });
    return res.json();
  },

  async spawnEmergency(origin = 'I1', destination = 'I6') {
    const res = await fetch(`${API_BASE}/emergency/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to spawn emergency vehicle');
    }
    return res.json();
  },

  async clearEmergency() {
    const res = await fetch(`${API_BASE}/emergency/clear`, { method: 'POST' });
    return res.json();
  },

  async optimizeClassical(): Promise<OptimizationResponse> {
    const res = await fetch(`${API_BASE}/optimize/classical`, { method: 'POST' });
    if (!res.ok) throw new Error('Classical optimization failed');
    return res.json();
  },

  async optimizeHybrid(weights?: {
    w_waiting_time: number;
    w_queue: number;
    w_congestion: number;
    w_emissions: number;
    w_emergency: number;
    penalty_multiplier: number;
  }): Promise<OptimizationResponse> {
    const res = await fetch(`${API_BASE}/optimize/hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights || {}),
    });
    if (!res.ok) throw new Error('Hybrid quantum optimization failed');
    return res.json();
  },

  async getMetrics(): Promise<{ kpis: any; history: MetricPoint[] }> {
    const res = await fetch(`${API_BASE}/metrics`);
    return res.json();
  },

  async getComparison(): Promise<{ records: Record<string, ComparisonRecord>; history: MetricPoint[] }> {
    const res = await fetch(`${API_BASE}/comparison`);
    return res.json();
  },
};

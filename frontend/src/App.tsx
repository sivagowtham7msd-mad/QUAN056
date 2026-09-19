import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiBar } from './components/KpiBar';
import { NetworkMap } from './components/NetworkMap';
import { ControlPanel } from './components/ControlPanel';
import { OptimizationPanel } from './components/OptimizationPanel';
import { EmergencyCorridorPanel } from './components/EmergencyCorridorPanel';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { QuantumExplainer } from './components/QuantumExplainer';
import { AboutSection } from './components/AboutSection';
import { SystemStatusModal } from './components/SystemStatusModal';
import { DemoModeRunner } from './components/DemoModeRunner';
import { api } from './services/api';
import { simulationSocket } from './services/socket';
import { 
  SimulationState, 
  OptimizationResponse, 
  MetricPoint,
  SystemKPIs
} from './types/traffic';
import confetti from 'canvas-confetti';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulation state
  const [simState, setSimState] = useState<SimulationState>({
    is_running: false,
    sim_time: 0,
    demand_level: 'MEDIUM',
    demand_ns: 1.0,
    demand_ew: 1.0,
    vehicles: [],
    active_events: [],
    emergency_vehicle: null,
    kpis: {
      avg_waiting_time: 0,
      total_queue: 0,
      throughput_per_hr: 420,
      fuel_consumption_l_hr: 0.8,
      co2_emissions_kg_hr: 1.85,
      emergency_eta_sec: null,
      active_vehicles: 0,
      total_spawned: 0,
      total_completed: 0,
      disclaimer: 'Simulation estimate',
    },
    network: {
      nodes: {},
      roads: {},
    },
  });

  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);
  const [lastOptimization, setLastOptimization] = useState<OptimizationResponse | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Connect WebSocket on mount
  useEffect(() => {
    simulationSocket.connect();

    const unsubscribe = simulationSocket.subscribe((newState) => {
      setSimState(newState);

      // Append KPI to local history
      if (newState.kpis) {
        setMetricsHistory((prev) => {
          const pt: MetricPoint = {
            timestamp: newState.sim_time,
            avg_waiting_time: newState.kpis.avg_waiting_time,
            total_queue: newState.kpis.total_queue,
            throughput_per_hr: newState.kpis.throughput_per_hr,
            fuel_consumption_l_hr: newState.kpis.fuel_consumption_l_hr,
            co2_emissions_kg_hr: newState.kpis.co2_emissions_kg_hr,
            active_vehicles: newState.kpis.active_vehicles,
          };
          const next = [...prev, pt];
          return next.slice(-40);
        });
      }
    });

    // Initial state fetch
    api.getState()
      .then((data) => {
        setSimState(data);
      })
      .catch((err) => {
        console.warn('Initial state fetch error (backend may still be booting):', err);
      });

    return () => {
      unsubscribe();
      simulationSocket.disconnect();
    };
  }, []);

  // Controls
  const handleStart = async () => {
    try {
      await api.start();
      setSimState((prev) => ({ ...prev, is_running: true }));
      showToast('Simulation started');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    try {
      await api.pause();
      setSimState((prev) => ({ ...prev, is_running: false }));
      showToast('Simulation paused');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await api.reset();
      const state = await api.getState();
      setSimState(state);
      setMetricsHistory([]);
      showToast('Simulation reset to initial state');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDemand = async (level: string, ns: number, ew: number) => {
    try {
      await api.setDemand(level, ns, ew);
      setSimState((prev) => ({
        ...prev,
        demand_level: level as any,
        demand_ns: ns,
        demand_ew: ew,
      }));
      showToast(`Traffic demand updated to ${level}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = async (preset: string) => {
    try {
      await api.applyPreset(preset);
      showToast(`Scenario Preset '${preset}' applied!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCongestion = async (nodeId: string) => {
    try {
      await api.triggerCongestion(nodeId);
      showToast(`Congestion surge triggered at ${nodeId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccident = async (roadId: string) => {
    try {
      await api.triggerAccident(roadId);
      showToast(`Accident triggered on road ${roadId}! Vehicles rerouting.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoadClosure = async (roadId: string) => {
    try {
      await api.triggerRoadClosure(roadId);
      showToast(`Road ${roadId} closed to traffic!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearEvents = async () => {
    try {
      await api.clearEvents();
      showToast('All active road hazards and closures cleared');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpawnEmergency = async (origin = 'I1', destination = 'I6') => {
    try {
      const res = await api.spawnEmergency(origin, destination);
      showToast(`🚑 Emergency Green Corridor activated from ${origin} to ${destination}!`);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch (e: any) {
      showToast(`Failed to spawn emergency: ${e.message}`);
    }
  };

  const handleClearEmergency = async () => {
    try {
      await api.clearEmergency();
      showToast('Emergency Corridor deactivated');
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassicalOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.optimizeClassical();
      setLastOptimization(res);
      showToast('Classical rule-based signal optimization applied!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleQuantumOptimize = async (weights?: any) => {
    setIsOptimizing(true);
    try {
      const res = await api.optimizeHybrid(weights);
      setLastOptimization(res);
      showToast('Hybrid Quantum (QAOA) optimization applied to network!');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header with Branding, Global Controls, and Nav */}
      <Header
        isRunning={simState.is_running}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onClassicalOptimize={handleClassicalOptimize}
        onQuantumOptimize={() => handleQuantumOptimize()}
        onRunDemo={() => setIsDemoRunning(true)}
        onOpenStatus={() => setIsStatusModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOptimizing={isOptimizing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* KPI Telemetry Bar */}
        <KpiBar
          kpis={simState.kpis}
          emergencyActive={Boolean(simState.emergency_vehicle?.is_active)}
        />

        {/* Tabbed Content Areas */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 8 columns: Interactive Road Network Digital Twin */}
            <div className="lg:col-span-8 space-y-5">
              <NetworkMap
                nodes={simState.network.nodes}
                roads={simState.network.roads}
                vehicles={simState.vehicles}
                emergencyVehicle={simState.emergency_vehicle}
                onRoadAction={(roadId, action) => {
                  if (action === 'accident') handleAccident(roadId);
                  else handleRoadClosure(roadId);
                }}
              />

              {/* Quick Summary of Active Corridor if Running */}
              {simState.emergency_vehicle?.is_active && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-300 font-mono font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>EMERGENCY CORRIDOR EN ROUTE: {simState.emergency_vehicle.origin} → {simState.emergency_vehicle.destination}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('emergency')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold"
                  >
                    View Corridor Telemetry →
                  </button>
                </div>
              )}
            </div>

            {/* Right 4 columns: Controls, Dynamic Events & Scenarios */}
            <div className="lg:col-span-4 space-y-5">
              <ControlPanel
                demandLevel={simState.demand_level}
                demandNS={simState.demand_ns}
                demandEW={simState.demand_ew}
                onSetDemand={handleSetDemand}
                onCongestion={handleCongestion}
                onAccident={handleAccident}
                onRoadClosure={handleRoadClosure}
                onClearEvents={handleClearEvents}
                onApplyPreset={handleApplyPreset}
                activeEvents={simState.active_events}
              />
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <OptimizationPanel
            onRunClassical={handleClassicalOptimize}
            onRunHybrid={handleQuantumOptimize}
            isOptimizing={isOptimizing}
            lastOptimization={lastOptimization}
            currentKPIs={simState.kpis}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyCorridorPanel
            emergencyVehicle={simState.emergency_vehicle}
            nodes={simState.network.nodes}
            onSpawnEmergency={handleSpawnEmergency}
            onClearEmergency={handleClearEmergency}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts currentMetrics={metricsHistory} />
        )}

        {activeTab === 'explainer' && (
          <QuantumExplainer />
        )}

        {activeTab === 'about' && (
          <AboutSection />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl text-xs font-semibold text-cyan-200 font-mono flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Diagnostics Modal */}
      <SystemStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

      {/* 1-Click Demo Mode Runner */}
      {isDemoRunning && (
        <DemoModeRunner
          isRunning={isDemoRunning}
          onClose={() => setIsDemoRunning(false)}
          onStartSim={handleStart}
          onSetDemand={handleSetDemand}
          onTriggerCongestion={handleCongestion}
          onClassicalOptimize={handleClassicalOptimize}
          onSpawnEmergency={handleSpawnEmergency}
          onQuantumOptimize={() => handleQuantumOptimize()}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}

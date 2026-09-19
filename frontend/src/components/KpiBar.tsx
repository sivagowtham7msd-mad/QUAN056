import React from 'react';
import { 
  Clock, 
  Layers, 
  TrendingUp, 
  CloudFog, 
  Fuel, 
  Ambulance, 
  Info 
} from 'lucide-react';
import { SystemKPIs } from '../types/traffic';

interface KpiBarProps {
  kpis: SystemKPIs;
  emergencyActive: boolean;
}

export const KpiBar: React.FC<KpiBarProps> = ({ kpis, emergencyActive }) => {
  const formatETA = (sec?: number | null) => {
    if (!sec) return 'STANDBY';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  const cards = [
    {
      id: 'wait-time',
      title: 'Avg Waiting Time',
      value: `${kpis.avg_waiting_time.toFixed(1)} s`,
      sub: 'Per queued vehicle',
      icon: Clock,
      color: kpis.avg_waiting_time > 35 ? 'text-rose-400' : 'text-cyan-400',
      badge: kpis.avg_waiting_time > 35 ? 'High Delay' : 'Optimal',
      badgeColor: kpis.avg_waiting_time > 35 ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'queue-len',
      title: 'Total Network Queue',
      value: `${kpis.total_queue} veh`,
      sub: `${kpis.active_vehicles} active in network`,
      icon: Layers,
      color: kpis.total_queue > 25 ? 'text-amber-400' : 'text-emerald-400',
      badge: kpis.total_queue > 25 ? 'Congestion Alert' : 'Flowing',
      badgeColor: kpis.total_queue > 25 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'throughput',
      title: 'Traffic Throughput',
      value: `${kpis.throughput_per_hr.toLocaleString()} veh/hr`,
      sub: `${kpis.total_completed} cleared to date`,
      icon: TrendingUp,
      color: 'text-indigo-400',
      badge: 'Real-time Flow',
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'fuel',
      title: 'Fuel Consumption',
      value: `${kpis.fuel_consumption_l_hr.toFixed(2)} L/hr`,
      sub: 'Idling & acceleration model',
      icon: Fuel,
      color: 'text-amber-400',
      badge: 'Sim Estimate',
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'emissions',
      title: 'CO₂ Emissions',
      value: `${kpis.co2_emissions_kg_hr.toFixed(2)} kg/hr`,
      sub: '2.31 kg CO₂ / L gasoline',
      icon: CloudFog,
      color: 'text-rose-400',
      badge: 'Sim Estimate',
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'emergency-eta',
      title: 'Emergency ETA',
      value: formatETA(kpis.emergency_eta_sec),
      sub: emergencyActive ? 'Green Corridor Priority' : 'Ambulance Standby',
      icon: Ambulance,
      color: emergencyActive ? 'text-emerald-400' : 'text-slate-400',
      badge: emergencyActive ? 'GREEN CORRIDOR' : 'Inactive',
      badgeColor: emergencyActive 
        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 animate-pulse' 
        : 'bg-slate-800 text-slate-500',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="glass-panel rounded-xl p-3.5 flex flex-col justify-between glass-panel-hover border border-slate-800/80 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {card.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-xl font-bold font-mono tracking-tight ${card.color}`}>
                  {card.value}
                </span>
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 truncate flex items-center gap-1">
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Simulation Estimate Notice */}
      <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-500 pr-1">
        <Info className="w-3 h-3 text-slate-500" />
        <span>Waiting time, queue, and emissions are dynamically computed from the microscopic simulation digital twin.</span>
      </div>
    </div>
  );
};

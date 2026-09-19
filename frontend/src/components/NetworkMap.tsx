import React, { useState } from 'react';
import { 
  IntersectionNode, 
  RoadSegment, 
  Vehicle, 
  EmergencyVehicle 
} from '../types/traffic';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Sparkles,
  Layers
} from 'lucide-react';

interface NetworkMapProps {
  nodes: Record<string, IntersectionNode>;
  roads: Record<string, RoadSegment>;
  vehicles: Vehicle[];
  emergencyVehicle: EmergencyVehicle | null;
  onSelectIntersection?: (id: string) => void;
  onRoadAction?: (roadId: string, action: 'accident' | 'closure') => void;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({
  nodes,
  roads,
  vehicles,
  emergencyVehicle,
  onSelectIntersection,
  onRoadAction,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);

  // Position lookup
  const getNodePos = (id: string): { x: number; y: number } => {
    if (nodes[id]) return { x: nodes[id].x, y: nodes[id].y };
    const defaults: Record<string, { x: number; y: number }> = {
      I1: { x: 180, y: 140 },
      I2: { x: 460, y: 140 },
      I3: { x: 740, y: 140 },
      I4: { x: 180, y: 380 },
      I5: { x: 460, y: 380 },
      I6: { x: 740, y: 380 },
    };
    return defaults[id] || { x: 100, y: 100 };
  };

  // Helper to calculate offset coordinates for bidirectional lanes
  const calculateVehiclePos = (road: RoadSegment, progress: number) => {
    const src = getNodePos(road.source);
    const tgt = getNodePos(road.target);
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Right-hand traffic offset: perpendicular vector
    const offset = 8;
    const nx = -dy / len;
    const ny = dx / len;

    const x = src.x + dx * progress + nx * offset;
    const y = src.y + dy * progress + ny * offset;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return { x, y, angle };
  };

  // Road congestion color
  const getRoadColor = (road: RoadSegment) => {
    if (road.status === 'CLOSED') return '#DC2626'; // Bright red
    if (road.status === 'ACCIDENT') return '#F97316'; // Bright orange
    if (road.active_corridor) return '#10B981'; // Neon green
    if (road.current_density > 0.6) return '#EF4444'; // Red
    if (road.current_density > 0.3) return '#F59E0B'; // Yellow
    return '#1E293B'; // Normal slate road
  };

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
    if (onSelectIntersection) onSelectIntersection(id);
  };

  const activeCorridorPath = emergencyVehicle?.is_active ? emergencyVehicle.path : [];

  return (
    <div className="w-full relative glass-panel rounded-2xl p-4 border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Map Header & Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Interconnected Road Network (Digital Twin)
          </h2>
          {emergencyVehicle?.is_active && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              EMERGENCY GREEN CORRIDOR ACTIVE
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-green-glow" />
            <span>Low / Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Congestion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Accident</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="w-full aspect-[16/9] max-h-[540px] bg-[#070A10]/95 rounded-xl border border-slate-900/90 relative overflow-hidden flex items-center justify-center">
        {/* Background Grid Accent */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <svg 
          viewBox="0 0 920 520" 
          className="w-full h-full select-none"
        >
          <defs>
            {/* Glow filters */}
            <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="emerald-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="ambulance-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Road Base Geometry */}
          {Object.values(roads).map((road) => {
            const src = getNodePos(road.source);
            const tgt = getNodePos(road.target);
            const isCorridor = road.active_corridor;
            const roadColor = getRoadColor(road);

            return (
              <g 
                key={road.id} 
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredRoadId(road.id)}
                onMouseLeave={() => setHoveredRoadId(null)}
                onClick={() => {
                  if (onRoadAction) {
                    onRoadAction(road.id, road.status === 'NORMAL' ? 'accident' : 'closure');
                  }
                }}
              >
                {/* Outer Asphalt Base */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="#151C2C"
                  strokeWidth="32"
                  strokeLinecap="round"
                />

                {/* Road Surface */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={roadColor}
                  strokeWidth={isCorridor ? "14" : "12"}
                  strokeLinecap="round"
                  className={isCorridor ? 'corridor-active' : ''}
                  filter={isCorridor ? "url(#emerald-glow)" : undefined}
                />

                {/* Center Road Divider Dashes */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="6,8"
                />

                {/* Accident / Closure Warning Badges */}
                {road.status === 'ACCIDENT' && (
                  <g transform={`translate(${(src.x + tgt.x) / 2}, ${(src.y + tgt.y) / 2})`}>
                    <circle r="12" fill="#F97316" className="animate-pulse" />
                    <text textAnchor="middle" dy="4" fontSize="10" fill="#FFFFFF" fontWeight="bold">⚠️</text>
                  </g>
                )}
                {road.status === 'CLOSED' && (
                  <g transform={`translate(${(src.x + tgt.x) / 2}, ${(src.y + tgt.y) / 2})`}>
                    <circle r="12" fill="#EF4444" className="animate-pulse" />
                    <text textAnchor="middle" dy="4" fontSize="9" fill="#FFFFFF" fontWeight="bold">⛔</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Normal Vehicles Moving Along Roads */}
          {vehicles.map((veh) => {
            const road = roads[veh.current_road_id];
            if (!road) return null;
            const pos = calculateVehiclePos(road, veh.progress);

            return (
              <g 
                key={veh.id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.angle})`}
                className="transition-transform duration-75"
              >
                {/* Vehicle Body */}
                <rect
                  x="-6"
                  y="-3.5"
                  width="12"
                  height="7"
                  rx="2"
                  fill={veh.color}
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                {/* Headlights */}
                <circle cx="5.5" cy="-2" r="0.9" fill="#FEF08A" />
                <circle cx="5.5" cy="2" r="0.9" fill="#FEF08A" />
              </g>
            );
          })}

          {/* 3. Emergency Ambulance Vehicle */}
          {emergencyVehicle && emergencyVehicle.is_active && emergencyVehicle.current_edge && roads[emergencyVehicle.current_edge] && (
            (() => {
              const road = roads[emergencyVehicle.current_edge];
              const pos = calculateVehiclePos(road, emergencyVehicle.progress);
              return (
                <g 
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.angle})`}
                  className="transition-transform duration-75 cursor-pointer"
                  filter="url(#ambulance-glow)"
                >
                  {/* Outer Siren Pulse */}
                  <circle cx="0" cy="0" r="14" fill="rgba(239, 68, 68, 0.3)" className="animate-ping" />
                  {/* Ambulance Body */}
                  <rect
                    x="-9"
                    y="-5"
                    width="18"
                    height="10"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                  />
                  {/* Red Cross */}
                  <rect x="-3" y="-1" width="6" height="2" fill="#EF4444" />
                  <rect x="-1" y="-3" width="2" height="6" fill="#EF4444" />
                  {/* Flashing Beacon */}
                  <circle cx="-2" cy="-4" r="1.5" fill="#3B82F6" className="animate-pulse" />
                  <circle cx="2" cy="-4" r="1.5" fill="#EF4444" className="animate-pulse" />
                </g>
              );
            })()
          )}

          {/* 4. Intersection Nodes & Signals */}
          {Object.values(nodes).map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isCorridor = node.is_corridor || activeCorridorPath.includes(node.id);
            const sigNS = node.signal_state.NS;
            const sigEW = node.signal_state.EW;

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Intersection Outer Ring */}
                <circle
                  r="34"
                  fill="#0B0F19"
                  stroke={isCorridor ? '#10B981' : isSelected ? '#06B6D4' : '#1E293B'}
                  strokeWidth={isCorridor ? '3' : isSelected ? '2.5' : '1.5'}
                  filter={isCorridor ? 'url(#emerald-glow)' : undefined}
                />

                {/* Node Identifier */}
                <text
                  textAnchor="middle"
                  dy="-8"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#F8FAFC"
                  fontFamily="monospace"
                >
                  {node.id}
                </text>

                {/* Queue Summary Badge */}
                <g transform="translate(0, 7)">
                  <rect
                    x="-18"
                    y="-6"
                    width="36"
                    height="12"
                    rx="4"
                    fill={node.queue_ns + node.queue_ew > 6 ? '#7F1D1D' : '#1E293B'}
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    fontSize="8"
                    fontWeight="bold"
                    fill={node.queue_ns + node.queue_ew > 6 ? '#FCA5A5' : '#94A3B8'}
                  >
                    Q: {node.queue_ns + node.queue_ew}
                  </text>
                </g>

                {/* Traffic Signals Box - North/South (Top) */}
                <g transform="translate(0, -46)">
                  <rect x="-14" y="-8" width="28" height="15" rx="3" fill="#030712" stroke="#334155" strokeWidth="0.8" />
                  {/* Red */}
                  <circle 
                    cx="-8" 
                    cy="-0.5" 
                    r="3.5" 
                    fill={sigNS === 'RED' ? '#EF4444' : '#3F1515'} 
                    className={sigNS === 'RED' ? 'signal-circle active-red' : ''}
                  />
                  {/* Yellow */}
                  <circle 
                    cx="0" 
                    cy="-0.5" 
                    r="3.5" 
                    fill={sigNS === 'YELLOW' ? '#F59E0B' : '#3F2D10'} 
                    className={sigNS === 'YELLOW' ? 'signal-circle active-yellow' : ''}
                  />
                  {/* Green */}
                  <circle 
                    cx="8" 
                    cy="-0.5" 
                    r="3.5" 
                    fill={sigNS === 'GREEN' ? '#10B981' : '#113E28'} 
                    className={sigNS === 'GREEN' ? 'signal-circle active-green' : ''}
                  />
                </g>

                {/* Traffic Signals Box - East/West (Right) */}
                <g transform="translate(46, 0)">
                  <rect x="-8" y="-14" width="15" height="28" rx="3" fill="#030712" stroke="#334155" strokeWidth="0.8" />
                  {/* Red */}
                  <circle 
                    cx="-0.5" 
                    cy="-8" 
                    r="3.5" 
                    fill={sigEW === 'RED' ? '#EF4444' : '#3F1515'} 
                    className={sigEW === 'RED' ? 'signal-circle active-red' : ''}
                  />
                  {/* Yellow */}
                  <circle 
                    cx="-0.5" 
                    cy="0" 
                    r="3.5" 
                    fill={sigEW === 'YELLOW' ? '#F59E0B' : '#3F2D10'} 
                    className={sigEW === 'YELLOW' ? 'signal-circle active-yellow' : ''}
                  />
                  {/* Green */}
                  <circle 
                    cx="-0.5" 
                    cy="8" 
                    r="3.5" 
                    fill={sigEW === 'GREEN' ? '#10B981' : '#113E28'} 
                    className={sigEW === 'GREEN' ? 'signal-circle active-green' : ''}
                  />
                </g>

                {/* Signal Countdown Indicator */}
                <g transform="translate(0, 24)">
                  <text
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={node.current_phase === 'NS' ? '#38BDF8' : '#A78BFA'}
                    fontFamily="monospace"
                  >
                    {node.current_phase}: {Math.max(0, Math.round(node.phase_remaining))}s
                  </text>
                </g>

                {/* Name Label */}
                <text
                  textAnchor="middle"
                  dy="-56"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94A3B8"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Detail Drawer for Selected Intersection */}
      {selectedNodeId && nodes[selectedNodeId] && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 font-mono">
              {selectedNodeId}
            </div>
            <div>
              <div className="font-bold text-slate-100">{nodes[selectedNodeId].name}</div>
              <div className="text-[11px] text-slate-400">
                Phase: <span className="text-cyan-300 font-semibold">{nodes[selectedNodeId].current_phase}</span> ({Math.round(nodes[selectedNodeId].phase_remaining)}s remaining) | Total Served: {nodes[selectedNodeId].total_served} vehicles
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Queues:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">NS: {nodes[selectedNodeId].queue_ns}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">EW: {nodes[selectedNodeId].queue_ew}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Timings:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">NS: {nodes[selectedNodeId].green_duration_ns}s</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">EW: {nodes[selectedNodeId].green_duration_ew}s</span>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

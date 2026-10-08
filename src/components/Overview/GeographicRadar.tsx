import React, { useState } from 'react';
import { Globe, MapPin, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { SecurityEvent } from '../../types/security';

interface GeographicRadarProps {
  events: SecurityEvent[];
  onSelectIpFilter: (ip: string) => void;
}

export const GeographicRadar: React.FC<GeographicRadarProps> = ({ events, onSelectIpFilter }) => {
  const [activeGeo, setActiveGeo] = useState<string | null>(null);

  // Aggregate by country
  const countryMap: Record<
    string,
    {
      country: string;
      countryCode: string;
      total: number;
      failed: number;
      threats: number;
      lat: number;
      lng: number;
      sampleIp: string;
    }
  > = {};

  events.forEach((evt) => {
    const key = evt.location.country || 'Unknown';
    if (!countryMap[key]) {
      countryMap[key] = {
        country: key,
        countryCode: evt.location.countryCode,
        total: 0,
        failed: 0,
        threats: 0,
        lat: evt.location.lat,
        lng: evt.location.lng,
        sampleIp: evt.ip
      };
    }
    countryMap[key].total += 1;
    if (evt.type === 'login_failed' || evt.type === 'brute_force_spike' || evt.type === 'password_spray') {
      countryMap[key].failed += 1;
    }
    if (evt.severity === 'critical' || evt.severity === 'high') {
      countryMap[key].threats += 1;
    }
  });

  const countryList = Object.values(countryMap).sort((a, b) => b.total - a.total);

  // Convert lat/lng to SVG 2D mercator projection coordinates (approximate 800x400 map)
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) * (800 / 360));
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 200 - (800 * mercN) / (2 * Math.PI);
    return {
      x: Math.max(30, Math.min(770, x)),
      y: Math.max(25, Math.min(375, y))
    };
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Geographic Threat Origin Radar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time coordinates and regional distribution of inbound authentication sessions.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {countryList.length} sovereign regions active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Coordinate Map with Threat Pings */}
        <div className="lg:col-span-2 relative bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 min-h-[220px] flex items-center justify-center overflow-hidden">
          {/* Stylized background world grid */}
          <svg viewBox="0 0 800 400" className="w-full h-full select-none">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#grid-pattern)" />
            {/* Equator & Meridian guides */}
            <line x1="0" y1="200" x2="800" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

            {/* Continent outline sketches for visual orientation */}
            <path
              d="M 120 100 Q 180 80 230 110 T 260 170 T 210 240 T 140 210 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <path
              d="M 230 250 Q 280 280 260 360 T 200 320 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <path
              d="M 380 90 Q 450 70 480 120 T 430 180 T 360 140 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <path
              d="M 400 190 Q 470 210 460 320 T 390 280 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <path
              d="M 520 80 Q 720 70 730 180 T 580 220 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <path
              d="M 640 270 Q 720 280 710 350 T 630 330 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.2"
            />

            {/* Inbound ping nodes */}
            {countryList.map((c) => {
              const { x, y } = projectCoords(c.lat, c.lng);
              const isSelected = activeGeo === c.country;
              const hasThreat = c.threats > 0;

              return (
                <g
                  key={c.country}
                  className="cursor-pointer"
                  onClick={() => onSelectIpFilter(c.sampleIp)}
                  onMouseEnter={() => setActiveGeo(c.country)}
                  onMouseLeave={() => setActiveGeo(null)}
                >
                  {/* Ping Ring for high threat */}
                  {hasThreat && (
                    <circle
                      cx={x}
                      cy={y}
                      r="14"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1"
                      className="animate-ping"
                      opacity="0.6"
                    />
                  )}
                  {/* Outer circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '9' : hasThreat ? '7' : '5'}
                    fill={hasThreat ? '#f43f5e' : c.failed > 2 ? '#f59e0b' : '#38bdf8'}
                    opacity={isSelected ? '1' : '0.85'}
                  />
                  {/* Center Dot */}
                  <circle cx={x} cy={y} r="2.5" fill="#ffffff" />
                  
                  {/* Label */}
                  <text
                    x={x + 10}
                    y={y + 4}
                    fill={isSelected ? '#ffffff' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isSelected ? '600' : '400'}
                  >
                    {c.countryCode || c.country} ({c.total})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Radar Overlay Information */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Threat Node</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Verified Source</span>
          </div>
        </div>

        {/* Regional Breakdown List */}
        <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
          <div className="text-xs font-medium text-slate-300 pb-1 border-b border-slate-800">
            Top Originating Geographies
          </div>
          {countryList.slice(0, 6).map((item) => (
            <div
              key={item.country}
              onClick={() => onSelectIpFilter(item.sampleIp)}
              className="p-2.5 rounded border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.country}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  <span>{item.total} events</span>
                  <span aria-hidden="true" className="mx-1 text-slate-600">·</span>
                  <span className={item.failed > 0 ? 'text-amber-400' : 'text-slate-400'}>
                    {item.failed} failed
                  </span>
                </div>
              </div>

              <div className="text-right">
                {item.threats > 0 ? (
                  <span className="text-xs font-mono font-medium text-rose-400 flex items-center gap-1 justify-end">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{item.threats} threats</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-emerald-400">Normal</span>
                )}
                <div className="text-[10px] font-mono text-cyan-400 flex items-center justify-end gap-0.5 mt-0.5">
                  <span>Filter IP</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { HourlyTimelinePoint } from '../../types/security';

interface TimelineChartProps {
  timeline: HourlyTimelinePoint[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ timeline }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(
    ...timeline.map((p) => Math.max(p.successCount + p.failedCount, p.threatCount, 8)),
    12
  );

  const height = 180;
  const paddingBottom = 26;
  const paddingTop = 15;
  const chartHeight = height - paddingBottom - paddingTop;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Authentication Activity & Threat Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly distribution of successful logins, failed attempts, and elevated threat signals.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span>Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
            <span>Threat Incidents</span>
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative">
        <svg
          viewBox={`0 0 1000 ${height}`}
          className="w-full h-48 overflow-visible select-none"
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x="6"
                  y={y - 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {Math.round(maxVal * ratio)}
                </text>
              </g>
            );
          })}

          {/* Render Timeline Bars */}
          {timeline.map((point, i) => {
            const colWidth = 1000 / timeline.length;
            const x = i * colWidth;
            const barWidth = Math.max(16, colWidth * 0.58);
            const barX = x + (colWidth - barWidth) / 2;

            const totalLogins = point.successCount + point.failedCount;
            const successHeight = (point.successCount / maxVal) * chartHeight;
            const failedHeight = (point.failedCount / maxVal) * chartHeight;

            const successY = paddingTop + chartHeight - successHeight;
            const failedY = successY - failedHeight;

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={point.hour}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Column hover backdrop */}
                {isHovered && (
                  <rect
                    x={x}
                    y={paddingTop}
                    width={colWidth}
                    height={chartHeight}
                    fill="#1e293b"
                    opacity="0.5"
                    rx="4"
                  />
                )}

                {/* Successful logins bar */}
                {point.successCount > 0 && (
                  <rect
                    x={barX}
                    y={successY}
                    width={barWidth}
                    height={successHeight}
                    fill="#10b981"
                    rx="2"
                    opacity={isHovered ? 1 : 0.85}
                  />
                )}

                {/* Failed logins stacked bar */}
                {point.failedCount > 0 && (
                  <rect
                    x={barX}
                    y={failedY}
                    width={barWidth}
                    height={failedHeight}
                    fill="#f59e0b"
                    rx="2"
                    opacity={isHovered ? 1 : 0.9}
                  />
                )}

                {/* Threat Spike pin / diamond marker */}
                {point.threatCount > 0 && (
                  <g>
                    <circle
                      cx={barX + barWidth / 2}
                      cy={Math.max(12, failedY - 8)}
                      r={isHovered ? "5" : "4"}
                      fill="#f43f5e"
                    />
                    <circle
                      cx={barX + barWidth / 2}
                      cy={Math.max(12, failedY - 8)}
                      r={isHovered ? "8" : "6"}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      opacity="0.75"
                    />
                  </g>
                )}

                {/* X-axis time label */}
                <text
                  x={x + colWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? '#38bdf8' : '#94a3b8'}
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {point.displayTime}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && timeline[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950 border border-slate-700 shadow-xl rounded-md p-2.5 text-xs font-mono"
            style={{
              top: '10px',
              left: `${Math.min(
                82,
                Math.max(8, ((hoveredIndex + 0.5) / timeline.length) * 100)
              )}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-slate-300 font-semibold mb-1 border-b border-slate-800 pb-1">
              Time Window: {timeline[hoveredIndex].displayTime}
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span>Successful Logins:</span>
              <span className="font-bold">{timeline[hoveredIndex].successCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-400">
              <span>Failed Logins:</span>
              <span className="font-bold">{timeline[hoveredIndex].failedCount}</span>
            </div>
            {timeline[hoveredIndex].threatCount > 0 && (
              <div className="flex items-center justify-between gap-4 text-rose-400 pt-0.5 font-bold">
                <span>Threat Alerts:</span>
                <span>{timeline[hoveredIndex].threatCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

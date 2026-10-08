import React from 'react';
import { Shield, Radio, Activity, RefreshCw, Download, Play, Pause } from 'lucide-react';
import { SecurityStats } from '../types/security';

interface HeaderProps {
  stats: SecurityStats;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onOpenSimulator: () => void;
  onExportLogs: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isStreaming,
  onToggleStreaming,
  onOpenSimulator,
  onExportLogs,
  onResetData
}) => {
  const getThreatColor = (score: number) => {
    if (score >= 75) return 'text-rose-400';
    if (score >= 45) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getThreatLabel = (score: number) => {
    if (score >= 75) return 'ELEVATED / CRITICAL';
    if (score >= 45) return 'GUARDED / MODERATE';
    return 'LOW / NORMAL';
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Threat Level */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-100 tracking-tight">
                SecOps Threat Intelligence
              </h1>
              <span className="text-xs font-mono text-slate-500">v2.4-SIEM</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Threat Level:</span>
              <span className={`font-mono font-medium ${getThreatColor(stats.threatScore)}`}>
                {stats.threatScore}/100 ({getThreatLabel(stats.threatScore)})
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono">{stats.monitoredUsersCount} accounts monitored</span>
            </div>
          </div>
        </div>

        {/* Live Status & Quick Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Ingestion Stream toggle */}
          <button
            onClick={onToggleStreaming}
            title={isStreaming ? 'Pause live security event stream' : 'Resume live security event stream'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isStreaming
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isStreaming ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono">Live Stream Active</span>
                <Pause className="w-3 h-3 ml-1" />
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-slate-400" />
                <span className="font-mono">Stream Paused</span>
                <Play className="w-3 h-3 ml-1 text-slate-300" />
              </>
            )}
          </button>

          {/* Quick Simulator CTA */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulate Incident</span>
          </button>

          {/* Export Logs */}
          <button
            onClick={onExportLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="Export raw security events to JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Reset State */}
          <button
            onClick={onResetData}
            className="p-1.5 rounded-md text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            title="Reset telemetry & sample data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

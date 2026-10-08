import React from 'react';
import { ShieldAlert, LogIn, AlertOctagon, ShieldCheck, Users } from 'lucide-react';
import { SecurityStats } from '../../types/security';

interface StatCardsProps {
  stats: SecurityStats;
  onNavigateToTab: (tab: any) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onNavigateToTab }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Events */}
      <div 
        onClick={() => onNavigateToTab('logs')}
        className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Total Events (24h)</span>
          <LogIn className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
          {stats.totalEvents24h.toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-mono text-emerald-400">{stats.successfulLogins24h} success</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Rolling 24h</span>
        </div>
      </div>

      {/* Failed Logins & Rate */}
      <div 
        onClick={() => onNavigateToTab('logs')}
        className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Failed Logins</span>
          <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
          {stats.failedLogins24h}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-mono text-amber-400 font-semibold">{stats.failedLoginRate}% failure rate</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Auth gate</span>
        </div>
      </div>

      {/* Critical Incidents */}
      <div 
        onClick={() => onNavigateToTab('alerts')}
        className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 hover:border-rose-900/50 transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Critical Alerts</span>
          <AlertOctagon className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
          {stats.criticalAlertsCount}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-mono text-rose-300">{stats.activeAlertsCount} total active</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Requires review</span>
        </div>
      </div>

      {/* Blocked Perimeter IPs */}
      <div 
        onClick={() => onNavigateToTab('blocklist')}
        className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Blocked IPs</span>
          <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
          {stats.blockedIpsCount}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-mono text-cyan-400">Firewall quarantine</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Edge drop</span>
        </div>
      </div>

      {/* Monitored Accounts */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Monitored Accounts</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums">
          {stats.monitoredUsersCount}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-mono text-slate-300">LDAP & Cloud SSO</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Active directory</span>
        </div>
      </div>
    </div>
  );
};

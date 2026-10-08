import React from 'react';
import { Crosshair, UserCheck, ShieldAlert, Zap } from 'lucide-react';
import { SecurityEvent } from '../../types/security';

interface ThreatVectorBreakdownProps {
  events: SecurityEvent[];
  onSelectUserFilter: (username: string) => void;
  onSelectTypeFilter: (type: string) => void;
}

export const ThreatVectorBreakdown: React.FC<ThreatVectorBreakdownProps> = ({
  events,
  onSelectUserFilter,
  onSelectTypeFilter
}) => {
  // Classification counts
  const vectorCounts = {
    bruteForce: events.filter((e) => e.type === 'brute_force_spike' || (e.type === 'login_failed' && (e.mitreTechnique?.includes('T1110') || e.metadata?.attemptCount > 3))).length,
    impossibleTravel: events.filter((e) => e.type === 'impossible_travel' || e.type === 'suspicious_geo').length,
    credentialStuffing: events.filter((e) => e.type === 'password_spray').length,
    privilegeEscalation: events.filter((e) => e.type === 'privilege_escalation').length,
    vulnerabilityScan: events.filter((e) => e.type === 'port_scan').length,
    mfaFatigue: events.filter((e) => e.type === 'mfa_denied').length
  };

  const totalThreatVectors = Object.values(vectorCounts).reduce((a, b) => a + b, 0) || 1;

  // Top Targeted User Accounts
  const userMap: Record<string, { total: number; failed: number; threats: number }> = {};
  events.forEach((evt) => {
    if (!userMap[evt.username]) {
      userMap[evt.username] = { total: 0, failed: 0, threats: 0 };
    }
    userMap[evt.username].total += 1;
    if (evt.type === 'login_failed' || evt.type === 'password_spray') {
      userMap[evt.username].failed += 1;
    }
    if (evt.severity === 'critical' || evt.severity === 'high') {
      userMap[evt.username].threats += 1;
    }
  });

  const topTargetedUsers = Object.entries(userMap)
    .sort(([, a], [, b]) => b.threats * 3 + b.failed - (a.threats * 3 + a.failed))
    .slice(0, 5);

  const vectorsList = [
    { label: 'Brute Force / Password Guessing', count: vectorCounts.bruteForce, typeKey: 'login_failed', color: 'bg-rose-500' },
    { label: 'Impossible Travel / Geolocation Velocity', count: vectorCounts.impossibleTravel, typeKey: 'impossible_travel', color: 'bg-amber-500' },
    { label: 'Credential Stuffing & Spraying', count: vectorCounts.credentialStuffing, typeKey: 'password_spray', color: 'bg-orange-500' },
    { label: 'Privilege Escalation Endpoints', count: vectorCounts.privilegeEscalation, typeKey: 'privilege_escalation', color: 'bg-purple-500' },
    { label: 'Automated Port & Vulnerability Scan', count: vectorCounts.vulnerabilityScan, typeKey: 'port_scan', color: 'bg-cyan-500' },
    { label: 'MFA Push Fatigue & Denials', count: vectorCounts.mfaFatigue, typeKey: 'mfa_denied', color: 'bg-yellow-500' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Attack Vector Distribution */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              MITRE Attack Classification Breakdown
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {totalThreatVectors} classified signals
          </span>
        </div>

        <div className="space-y-3.5">
          {vectorsList.map((vec) => {
            const percentage = Math.round((vec.count / totalThreatVectors) * 100);
            return (
              <div
                key={vec.label}
                onClick={() => onSelectTypeFilter(vec.typeKey)}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 group-hover:text-cyan-300 transition-colors">
                    {vec.label}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <span className="text-slate-200 font-semibold">{vec.count}</span>
                    <span className="text-slate-500">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${vec.color} transition-all duration-500`}
                    style={{ width: `${Math.max(percentage, vec.count > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Targeted Accounts */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              High-Risk Targeted User Identities
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Risk-weighted triage</span>
        </div>

        <div className="space-y-2">
          {topTargetedUsers.map(([username, stats]) => {
            const isHighRisk = stats.threats > 0 || stats.failed >= 3;
            return (
              <div
                key={username}
                onClick={() => onSelectUserFilter(username)}
                className="p-2.5 rounded border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-mono font-medium text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <span>{username}</span>
                    {username === 'admin' || username === 'root' ? (
                      <span className="text-[10px] text-rose-400 font-sans">Privileged</span>
                    ) : null}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    <span>{stats.total} total sessions</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                    <span className={stats.failed > 0 ? 'text-amber-400' : 'text-slate-400'}>
                      {stats.failed} failed
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isHighRisk ? (
                    <span className="text-xs font-mono text-rose-400 flex items-center gap-1 justify-end">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{stats.threats} incident{stats.threats !== 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400">Low Risk</span>
                  )}
                  <div className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors mt-0.5 font-mono">
                    Filter logs →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

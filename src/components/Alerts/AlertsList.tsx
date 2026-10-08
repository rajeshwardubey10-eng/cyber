import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldX, 
  Clock, 
  Check, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { SecurityAlert, AlertStatus, Severity } from '../../types/security';

interface AlertsListProps {
  alerts: SecurityAlert[];
  onUpdateStatus: (alertId: string, status: AlertStatus, notes?: string) => void;
  onBlockIp: (ip: string, reason: string) => void;
  isIpBlocked: (ip: string) => boolean;
  onFilterLogsByTarget: (ip: string) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  onUpdateStatus,
  onBlockIp,
  isIpBlocked,
  onFilterLogsByTarget
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return <span className="font-mono text-rose-400 font-bold">CRITICAL SEVERITY</span>;
      case 'high':
        return <span className="font-mono text-orange-400 font-semibold">HIGH SEVERITY</span>;
      case 'medium':
        return <span className="font-mono text-amber-400 font-medium">MEDIUM SEVERITY</span>;
      default:
        return <span className="font-mono text-slate-400">LOW SEVERITY</span>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="text-rose-400 font-mono text-xs flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            ACTIVE UNRESOLVED
          </span>
        );
      case 'investigating':
        return (
          <span className="text-amber-400 font-mono text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            UNDER INVESTIGATION
          </span>
        );
      case 'resolved':
        return (
          <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RESOLVED
          </span>
        );
      case 'dismissed':
        return (
          <span className="text-slate-500 font-mono text-xs flex items-center gap-1">
            FALSE POSITIVE
          </span>
        );
    }
  };

  const handleResolveAlert = (alertId: string) => {
    onUpdateStatus(alertId, 'resolved', resolutionInput || 'Resolved by SOC Analyst review and containment.');
    setResolutionInput('');
    setSelectedAlert(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Correlated Security Incidents & Threat Alerts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alerts triggered by the SIEM detection engine based on policy rules.
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-md border border-slate-800 text-xs">
          {(['all', 'active', 'investigating', 'resolved', 'dismissed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded capitalize transition-colors ${
                statusFilter === filter
                  ? 'bg-slate-800 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid / Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-12 text-center text-slate-400 text-xs">
            No alerts found matching filter criteria '{statusFilter}'.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const blocked = isIpBlocked(alert.targetIp);
            return (
              <div
                key={alert.id}
                className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400">{alert.id}</span>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    <h3 className="text-sm font-semibold text-slate-100">{alert.ruleName}</h3>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <div>{getStatusBadge(alert.status)}</div>
                </div>

                {/* Body Content */}
                <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="md:col-span-2 space-y-2">
                    <p className="font-sans text-slate-200 leading-relaxed text-xs">
                      {alert.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-400">
                      <div>
                        Target Identity: <span className="text-cyan-300 font-bold">{alert.targetUser}</span>
                      </div>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <div>
                        Target IP: <span className="text-slate-200">{alert.targetIp}</span>
                      </div>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <div>
                        Detected:{' '}
                        <span className="text-slate-300">
                          {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* MITRE technique */}
                    <div className="text-[11px] text-rose-400 pt-1">
                      ATT&CK Framework: {alert.mitreTechnique}
                    </div>
                  </div>

                  {/* Remediation Playbook Box */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3 text-slate-300 font-sans space-y-1.5">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wide">
                      Remediation Guidance
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {alert.remediation}
                    </p>
                    {alert.resolutionNotes && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                        Resolution Notes: {alert.resolutionNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <span>{alert.eventCount} correlated event{alert.eventCount !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => onFilterLogsByTarget(alert.targetIp)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans text-xs ml-2"
                    >
                      <span>View in Log Explorer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Operational Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Quarantine Button */}
                    {!blocked ? (
                      <button
                        onClick={() => onBlockIp(alert.targetIp, `Incident ${alert.id}: ${alert.ruleName}`)}
                        className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-medium transition-colors flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Quarantine IP</span>
                      </button>
                    ) : (
                      <span className="text-rose-400 font-mono text-xs flex items-center gap-1">
                        <ShieldX className="w-3.5 h-3.5" />
                        <span>IP Quarantined</span>
                      </span>
                    )}

                    {/* Status Modifiers */}
                    {alert.status === 'active' && (
                      <button
                        onClick={() => onUpdateStatus(alert.id, 'investigating')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                      >
                        Start Investigation
                      </button>
                    )}

                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-2.5 py-1 rounded bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    )}

                    {alert.status !== 'dismissed' && (
                      <button
                        onClick={() => onUpdateStatus(alert.id, 'dismissed', 'Marked as false positive by analyst')}
                        className="px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        False Positive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Incident Dialog Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resolve Security Incident {selectedAlert.id}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3 font-sans">
              Provide resolution notes for the SOC audit trail regarding mitigation taken.
            </p>

            <textarea
              rows={3}
              value={resolutionInput}
              onChange={(e) => setResolutionInput(e.target.value)}
              placeholder="e.g. Session revoked, user contacted via Slack, IP blocked at Cloudflare edge."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-4 font-mono"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveAlert(selectedAlert.id)}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Sliders, ShieldCheck, ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { DetectionRule, Severity } from '../../types/security';

interface RulesManagerProps {
  rules: DetectionRule[];
  onUpdateRule: (ruleId: string, updates: Partial<DetectionRule>) => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({ rules, onUpdateRule }) => {
  const getSeverityStyle = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'text-rose-400 font-bold';
      case 'high':
        return 'text-orange-400 font-semibold';
      case 'medium':
        return 'text-amber-400 font-medium';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>SIEM Detection & Automated Policy Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune correlation sensitivity, time window thresholds, and automated active-response containment playbooks.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {rules.filter((r) => r.enabled).length} of {rules.length} rules active
          </span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="space-y-3">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`bg-slate-900/70 border rounded-lg p-5 transition-colors ${
                rule.enabled ? 'border-slate-800' : 'border-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-cyan-400">{rule.id}</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <h3 className="text-sm font-semibold text-slate-100">{rule.name}</h3>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className={`text-xs font-mono ${getSeverityStyle(rule.severity)}`}>
                    {rule.severity.toUpperCase()}
                  </span>
                </div>

                {/* Enable / Disable Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      rule.enabled ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 py-3 leading-relaxed font-sans">
                {rule.description}
              </p>

              {/* Configuration Inputs */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                {/* Threshold */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Event Count Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={rule.threshold}
                      onChange={(e) =>
                        onUpdateRule(rule.id, { threshold: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-500 text-[11px]">events</span>
                  </div>
                </div>

                {/* Window */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Rolling Time Window
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={rule.windowMinutes}
                      onChange={(e) =>
                        onUpdateRule(rule.id, { windowMinutes: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-500 text-[11px]">minutes</span>
                  </div>
                </div>

                {/* Automated Response Playbook */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Automated Action Playbook
                  </label>
                  <select
                    value={rule.autoAction}
                    onChange={(e) =>
                      onUpdateRule(rule.id, { autoAction: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="block_ip">Quarantine & Auto-Block IP</option>
                    <option value="alert_only">Alert Only (SOC Triage)</option>
                    <option value="revoke_session">Immediate Session Revocation</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

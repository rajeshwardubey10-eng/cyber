import React, { useState } from 'react';
import { ShieldBan, Plus, Trash2, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { BlockedIp } from '../../types/security';

interface BlocklistManagerProps {
  blockedIps: BlockedIp[];
  onAddBlock: (ip: string, reason: string) => void;
  onUnblock: (ip: string) => void;
}

export const BlocklistManager: React.FC<BlocklistManagerProps> = ({
  blockedIps,
  onAddBlock,
  onUnblock
}) => {
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic IP validation regex
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      setError('Please provide a valid IPv4 address (e.g. 192.168.1.1).');
      return;
    }

    if (!newReason.trim()) {
      setError('Please provide a reason for the quarantine.');
      return;
    }

    onAddBlock(newIp.trim(), newReason.trim());
    setNewIp('');
    setNewReason('');
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-cyan-400" />
              <span>Perimeter Firewall Quarantine & Blocklist</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              IP addresses actively intercepted and dropped at the edge gateway before reaching authentication handlers.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {blockedIps.length} active perimeter quarantines
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Manual Add Quarantine Form */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 h-fit">
          <div className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manually Quarantine IP</span>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
            {error && (
              <div className="p-2 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] flex items-center gap-1.5 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Target IPv4 Address</label>
              <input
                type="text"
                placeholder="e.g. 198.51.100.8"
                value={newIp}
                onChange={(e) => {
                  setNewIp(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Containment Reason / Justification</label>
              <textarea
                rows={2}
                placeholder="e.g. Malicious port scan / Threat intelligence feed match"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors text-xs"
            >
              Enforce Perimeter Quarantine
            </button>
          </form>
        </div>

        {/* Blocked List Table */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono">
                  <th className="py-3 px-4 font-medium">IP ADDRESS</th>
                  <th className="py-3 px-4 font-medium">LOCATION</th>
                  <th className="py-3 px-4 font-medium">REASON & AUDIT</th>
                  <th className="py-3 px-4 font-medium">RISK SCORE</th>
                  <th className="py-3 px-4 font-medium">SOURCE</th>
                  <th className="py-3 px-3 text-right font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {blockedIps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      No IP addresses currently under perimeter quarantine.
                    </td>
                  </tr>
                ) : (
                  blockedIps.map((b) => (
                    <tr key={b.ip} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-cyan-300 font-bold whitespace-nowrap">
                        {b.ip}
                      </td>

                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.city}, {b.country}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate" title={b.reason}>
                        {b.reason}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-rose-400 font-bold tabular-nums">
                          {b.riskScore}/100
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {b.autoBlocked ? (
                          <span className="text-cyan-400 text-[11px]">Auto SIEM Rule</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Manual Admin</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onUnblock(b.ip)}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                        >
                          Unblock IP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Terminal, Play, Database, Table, Download, FileText, Check } from 'lucide-react';
import { securityEngine } from '../../services/securityEngine';

export const SqlConsole: React.FC = () => {
  const PRESET_QUERIES = [
    {
      title: 'Top Attackers by Failed Logins',
      sql: "SELECT ip, country, count(*) FROM security_events WHERE type = 'login_failed' GROUP BY ip;"
    },
    {
      title: 'Active Critical Alerts',
      sql: "SELECT id, rule_name, target_user, target_ip, mitre_technique FROM security_alerts WHERE severity = 'critical';"
    },
    {
      title: 'User Authentication Volume by Identity',
      sql: "SELECT username, count(*) FROM security_events GROUP BY username;"
    },
    {
      title: 'All Blocked Firewall IPs & Risk Scores',
      sql: "SELECT ip, reason, country, risk_score, auto_blocked FROM blocked_ips;"
    },
    {
      title: 'Active Detection Rules Configuration',
      sql: "SELECT name, severity, enabled, threshold, window_minutes, category FROM detection_rules;"
    }
  ];

  const [query, setQuery] = useState(PRESET_QUERIES[0].sql);
  const [result, setResult] = useState<{ columns: string[]; rows: any[]; error?: string; rowCount: number }>(() =>
    securityEngine.executeSqlQuery(PRESET_QUERIES[0].sql)
  );
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    const res = securityEngine.executeSqlQuery(query);
    setResult(res);
  };

  const handleExportCsv = () => {
    if (!result || result.rows.length === 0) return;
    const header = result.columns.join(',');
    const rows = result.rows.map((r) => r.map((val: any) => `"${val}"`).join(','));
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secops_query_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>SQLite Security Analytics Console</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Run real-time analytical SQL queries directly across the normalized relational security database.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SQLite Dialect Engine: Ready</span>
          </div>
        </div>
      </div>

      {/* Editor & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Presets Sidebar */}
        <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forensic Query Library</span>
          </div>
          {PRESET_QUERIES.map((p) => (
            <button
              key={p.title}
              onClick={() => {
                setQuery(p.sql);
                const res = securityEngine.executeSqlQuery(p.sql);
                setResult(res);
              }}
              className="w-full text-left p-2 rounded text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 border border-slate-800/80 transition-colors"
            >
              <div className="font-medium">{p.title}</div>
              <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{p.sql}</div>
            </button>
          ))}

          {/* Database Schemas Guide */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 font-semibold mb-1">Available Tables:</div>
            <div className="space-y-1 text-[11px] font-mono text-slate-400">
              <div>• <span className="text-cyan-300">security_events</span></div>
              <div>• <span className="text-cyan-300">security_alerts</span></div>
              <div>• <span className="text-cyan-300">blocked_ips</span></div>
              <div>• <span className="text-cyan-300">detection_rules</span></div>
            </div>
          </div>
        </div>

        {/* SQL Input Area */}
        <div className="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-medium text-slate-300">SQL Query Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Query</span>
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 selection:bg-cyan-500/20"
            placeholder="SELECT * FROM security_events WHERE severity = 'critical';"
          />

          {/* Results Table */}
          <div className="border border-slate-800 rounded bg-slate-950/60 overflow-hidden flex flex-col">
            <div className="p-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span>Result: {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned</span>
                {result.error && <span className="text-rose-400">({result.error})</span>}
              </div>
              {result.rows.length > 0 && !result.error && (
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                    {result.columns.map((col, idx) => (
                      <th key={idx} className="py-2 px-3 font-semibold uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/30">
                      {Array.isArray(row) ? (
                        row.map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                            {String(val)}
                          </td>
                        ))
                      ) : (
                        <td className="py-2 px-3">{String(row)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

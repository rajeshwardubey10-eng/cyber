import React, { useState } from 'react';
import { 
  Crosshair, 
  Play, 
  Terminal, 
  CheckCircle2, 
  AlertOctagon, 
  Zap, 
  Globe, 
  KeyRound,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AttackSimulatorProps {
  onRunSimulation: (scenario: 'brute_force' | 'credential_stuffing' | 'impossible_travel' | 'privilege_escalation' | 'benign_rush') => string;
  onNavigateToTab: (tab: any) => void;
}

export const AttackSimulator: React.FC<AttackSimulatorProps> = ({ onRunSimulation, onNavigateToTab }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'SecOps Threat Simulation Sandbox initialized.',
    'Rule evaluation engine standing by for live vector injection.'
  ]);
  const [lastScenario, setLastScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'brute_force' as const,
      title: 'High-Frequency Brute Force Vector',
      target: 'Superuser account (root_admin)',
      mitre: 'T1110.001 (Password Guessing)',
      description: 'Simulates an automated Hydra bot sending 5 rapid invalid credential payloads within seconds from 194.26.29.112.',
      expectedResult: 'Triggers High-Frequency Brute Force rule, generates Critical alert, and auto-quarantines source IP.',
      icon: KeyRound,
      color: 'border-rose-800/80 hover:border-rose-600'
    },
    {
      id: 'credential_stuffing' as const,
      title: 'Distributed Credential Stuffing',
      target: 'Multiple corporate employee accounts',
      mitre: 'T1110.003 (Password Spraying)',
      description: 'Simulates a botnet cycling through breached credential pairs across 5 distinct usernames from a single external proxy.',
      expectedResult: 'Flags distributed password spraying behavior, triggers High severity alert.',
      icon: Crosshair,
      color: 'border-orange-800/80 hover:border-orange-600'
    },
    {
      id: 'impossible_travel' as const,
      title: 'Impossible Geolocation Velocity',
      target: 'elena.rodriguez@company.internal',
      mitre: 'T1078.004 (Cloud Valid Accounts)',
      description: 'Executes a legitimate login in Berlin, Germany immediately followed by an authentication token renewal in Sydney, Australia 4 minutes later.',
      expectedResult: 'Triggers Impossible Velocity anomaly rule, calculates ~16,000 km physical impossibility.',
      icon: Globe,
      color: 'border-amber-800/80 hover:border-amber-600'
    },
    {
      id: 'privilege_escalation' as const,
      title: 'Privilege Escalation Probe',
      target: 'contractor_temp04',
      mitre: 'T1068 (Privilege Escalation)',
      description: 'Simulates a low-privileged contractor session sending crafted HTTP payloads to /api/v1/roles/admin to escalate permissions.',
      expectedResult: 'Fires Critical RBAC authorization alert and flags session for revocation.',
      icon: AlertOctagon,
      color: 'border-purple-800/80 hover:border-purple-600'
    },
    {
      id: 'benign_rush' as const,
      title: 'Benign Peak-Hour Employee Rush',
      target: 'Engineering team SSO logins',
      mitre: 'Legitimate Authorized Operations',
      description: 'Injects authorized single-sign-on authentications with multi-factor biometric certificates to lower threat ratios.',
      expectedResult: 'Smoothly absorbs into baseline metrics, verifying false-positive immunity.',
      icon: ShieldCheck,
      color: 'border-emerald-800/80 hover:border-emerald-600'
    }
  ];

  const handleLaunch = (scenarioId: typeof scenarios[number]['id'], title: string) => {
    setIsRunning(true);
    setLastScenario(title);
    const time = new Date().toLocaleTimeString();

    setLogs((prev) => [
      `[${time}] Launching vector: ${title}...`,
      `[${time}] Injecting synthetic authentication packets into ingestion pipeline...`,
      ...prev
    ]);

    setTimeout(() => {
      const resultMessage = onRunSimulation(scenarioId);
      const postTime = new Date().toLocaleTimeString();
      setLogs((prev) => [
        `[${postTime}] SIEM Rule Engine processed events. ${resultMessage}`,
        `[${postTime}] Correlation completed: Dashboard threat score updated.`,
        ...prev
      ]);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Introduction Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>Cybersecurity Threat Simulator & Attack Lab</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Validate SIEM detection rules, correlation logic, and automated containment policies by launching realistic test vectors.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">SOC Validation Lab</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scenario Selection Grid */}
        <div className="lg:col-span-2 space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                className={`bg-slate-900/70 border rounded-lg p-4 transition-all duration-200 ${sc.color}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{sc.title}</h3>
                      <div className="text-[11px] font-mono text-slate-400">
                        Target: <span className="text-slate-300">{sc.target}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch(sc.id, sc.title)}
                    disabled={isRunning}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Attack</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  {sc.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-2 border-t border-slate-800/80 font-mono">
                  <span className="text-rose-400">{sc.mitre}</span>
                  <span className="text-slate-400">{sc.expectedResult}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Attack Lab Terminal & Post-Execution Links */}
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  Execution Telemetry Stream
                </span>
              </div>
              <button
                onClick={() => setLogs(['Telemetry cleared. Ready for next test run.'])}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-300 pr-1 select-text scrollbar-thin">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    log.includes('Launch')
                      ? 'text-cyan-300'
                      : log.includes('processed')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('Critical')
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            {/* Quick jump to inspect results */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => onNavigateToTab('alerts')}
                className="text-rose-400 hover:text-rose-300 transition-colors"
              >
                View Triggered Alerts →
              </button>
              <button
                onClick={() => onNavigateToTab('logs')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Inspect Logs →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

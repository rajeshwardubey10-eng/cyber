import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { StatCards } from './components/Overview/StatCards';
import { TimelineChart } from './components/Overview/TimelineChart';
import { GeographicRadar } from './components/Overview/GeographicRadar';
import { ThreatVectorBreakdown } from './components/Overview/ThreatVectorBreakdown';
import { ActivityLogsTable } from './components/Logs/ActivityLogsTable';
import { AlertsList } from './components/Alerts/AlertsList';
import { AttackSimulator } from './components/Simulator/AttackSimulator';
import { BlocklistManager } from './components/Blocklist/BlocklistManager';
import { SqlConsole } from './components/SqlConsole/SqlConsole';
import { RulesManager } from './components/Rules/RulesManager';
import { securityEngine } from './services/securityEngine';
import { SecurityEvent, SecurityAlert, BlockedIp, DetectionRule, SecurityStats, HourlyTimelinePoint } from './types/security';
import { ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [events, setEvents] = useState<SecurityEvent[]>(() => securityEngine.getEvents());
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => securityEngine.getAlerts());
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>(() => securityEngine.getBlockedIps());
  const [rules, setRules] = useState<DetectionRule[]>(() => securityEngine.getRules());
  const [stats, setStats] = useState<SecurityStats>(() => securityEngine.getStats());
  const [timeline, setTimeline] = useState<HourlyTimelinePoint[]>(() => securityEngine.getHourlyTimeline());
  const [isStreaming, setIsStreaming] = useState<boolean>(() => securityEngine.isStreamActive());
  const [logsInitialSearch, setLogsInitialSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ id: string; text: string; severity: string } | null>(null);

  // Sync state with SecurityEngine
  const refreshState = useCallback(() => {
    setEvents(securityEngine.getEvents());
    setAlerts(securityEngine.getAlerts());
    setBlockedIps(securityEngine.getBlockedIps());
    setRules(securityEngine.getRules());
    setStats(securityEngine.getStats());
    setTimeline(securityEngine.getHourlyTimeline());
    setIsStreaming(securityEngine.isStreamActive());
  }, []);

  useEffect(() => {
    const unsubscribe = securityEngine.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, [refreshState]);

  // Toast listener for new critical alerts
  useEffect(() => {
    const latestCritical = alerts.find(
      (a) => a.severity === 'critical' && a.status === 'active' && Date.now() - new Date(a.detectedAt).getTime() < 10000
    );
    if (latestCritical) {
      setToastMessage({
        id: latestCritical.id,
        text: `CRITICAL ALERT: ${latestCritical.ruleName} detected for user '${latestCritical.targetUser}'`,
        severity: 'critical'
      });
      const timer = setTimeout(() => setToastMessage(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const handleToggleStreaming = () => {
    const active = securityEngine.toggleLiveStream();
    setIsStreaming(active);
  };

  const handleBlockIp = (ip: string, reason: string) => {
    securityEngine.blockIp(ip, reason);
    setToastMessage({
      id: `block-${Date.now()}`,
      text: `Perimeter firewall quarantine enforced for IP ${ip}`,
      severity: 'info'
    });
  };

  const handleUnblockIp = (ip: string) => {
    securityEngine.unblockIp(ip);
    setToastMessage({
      id: `unblock-${Date.now()}`,
      text: `IP ${ip} removed from perimeter blocklist`,
      severity: 'info'
    });
  };

  const handleUpdateAlertStatus = (alertId: string, status: any, notes?: string) => {
    securityEngine.updateAlertStatus(alertId, status, notes);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<DetectionRule>) => {
    securityEngine.updateRule(ruleId, updates);
  };

  const handleRecordCustomEvent = (eventData: any) => {
    securityEngine.addEvent(eventData);
  };

  const handleRunSimulation = (scenario: any) => {
    const msg = securityEngine.runSimulation(scenario);
    setToastMessage({
      id: `sim-${Date.now()}`,
      text: msg,
      severity: 'info'
    });
    return msg;
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secops_siem_events_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all security telemetry, alerts, and firewall rules to original state?')) {
      securityEngine.resetToDefaults();
      refreshState();
    }
  };

  const handleFilterLogsByTarget = (query: string) => {
    setLogsInitialSearch(query);
    setActiveTab('logs');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Toast Notification */}
      {toastMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between transition-all z-50 ${
            toastMessage.severity === 'critical'
              ? 'bg-rose-950/90 border-b border-rose-800 text-rose-200'
              : 'bg-cyan-950/90 border-b border-cyan-800 text-cyan-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-mono">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        stats={stats}
        isStreaming={isStreaming}
        onToggleStreaming={handleToggleStreaming}
        onOpenSimulator={() => setActiveTab('simulator')}
        onExportLogs={handleExportLogs}
        onResetData={handleResetData}
      />

      {/* Primary Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'logs') setLogsInitialSearch('');
          setActiveTab(tab);
        }}
        activeAlertsCount={stats.activeAlertsCount}
        blockedCount={stats.blockedIpsCount}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <StatCards stats={stats} onNavigateToTab={setActiveTab} />

            {/* Time-Series Activity & Threat Spikes */}
            <TimelineChart timeline={timeline} />

            {/* Geographic Radar */}
            <GeographicRadar
              events={events}
              onSelectIpFilter={handleFilterLogsByTarget}
            />

            {/* Attack Vectors & High Risk Accounts */}
            <ThreatVectorBreakdown
              events={events}
              onSelectUserFilter={handleFilterLogsByTarget}
              onSelectTypeFilter={(type) => {
                setLogsInitialSearch(type);
                setActiveTab('logs');
              }}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <ActivityLogsTable
            events={events}
            initialSearch={logsInitialSearch}
            onBlockIp={handleBlockIp}
            isIpBlocked={(ip) => securityEngine.isIpBlocked(ip)}
            onRecordCustomEvent={handleRecordCustomEvent}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsList
            alerts={alerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onBlockIp={handleBlockIp}
            isIpBlocked={(ip) => securityEngine.isIpBlocked(ip)}
            onFilterLogsByTarget={handleFilterLogsByTarget}
          />
        )}

        {activeTab === 'simulator' && (
          <AttackSimulator
            onRunSimulation={handleRunSimulation}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'blocklist' && (
          <BlocklistManager
            blockedIps={blockedIps}
            onAddBlock={handleBlockIp}
            onUnblock={handleUnblockIp}
          />
        )}

        {activeTab === 'sql' && <SqlConsole />}

        {activeTab === 'rules' && (
          <RulesManager rules={rules} onUpdateRule={handleUpdateRule} />
        )}
      </main>

      {/* SOC Command Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Security Information & Event Management (SIEM)</span>
            <span aria-hidden="true">·</span>
            <span>Edge Reverse Proxy & Auth Gateway Active</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            MITRE ATT&CK v14.1 · SQLite Forensic Analytics · ISO/IEC 27001 SOC Compliance
          </div>
        </div>
      </footer>
    </div>
  );
}

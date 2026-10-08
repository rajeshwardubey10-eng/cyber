import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  X, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink,
  PlusCircle,
  FileCode
} from 'lucide-react';
import { SecurityEvent, EventType, Severity } from '../../types/security';

interface ActivityLogsTableProps {
  events: SecurityEvent[];
  initialSearch?: string;
  onBlockIp: (ip: string, reason: string) => void;
  isIpBlocked: (ip: string) => boolean;
  onRecordCustomEvent: (data: any) => void;
}

export const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({
  events,
  initialSearch = '',
  onBlockIp,
  isIpBlocked,
  onRecordCustomEvent
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Quick manual event injection state
  const [newEventUser, setNewEventUser] = useState('demo.analyst@company.internal');
  const [newEventIp, setNewEventIp] = useState('192.168.1.105');
  const [newEventType, setNewEventType] = useState<EventType>('login_failed');
  const [newEventDetails, setNewEventDetails] = useState('Manual simulated test authentication attempt.');

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search matches
      const matchesSearch =
        searchTerm === '' ||
        e.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.mitreTechnique && e.mitreTechnique.toLowerCase().includes(searchTerm.toLowerCase()));

      // Severity matches
      const matchesSeverity = selectedSeverity === 'all' || e.severity === selectedSeverity;

      // Type matches
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'failed' && (e.type === 'login_failed' || e.type === 'brute_force_spike' || e.type === 'password_spray')) ||
        (selectedType === 'success' && e.type === 'login_success') ||
        (selectedType === 'threats' && (e.severity === 'critical' || e.severity === 'high')) ||
        e.type === selectedType;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [events, searchTerm, selectedSeverity, selectedType]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
  };

  const getSeverityStyle = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'text-rose-400 font-semibold';
      case 'high':
        return 'text-orange-400 font-medium';
      case 'medium':
        return 'text-amber-400';
      case 'low':
        return 'text-sky-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIndicator = (status: SecurityEvent['status'], ip: string) => {
    if (status === 'blocked' || isIpBlocked(ip)) {
      return (
        <span className="text-rose-400 font-mono flex items-center gap-1 text-xs">
          <ShieldX className="w-3.5 h-3.5" />
          <span>BLOCKED</span>
        </span>
      );
    }
    if (status === 'flagged') {
      return (
        <span className="text-amber-400 font-mono flex items-center gap-1 text-xs">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>FLAGGED</span>
        </span>
      );
    }
    return (
      <span className="text-emerald-400 font-mono flex items-center gap-1 text-xs">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>ALLOWED</span>
      </span>
    );
  };

  const handleCopyJson = (event: SecurityEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddCustomEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecordCustomEvent({
      username: newEventUser,
      ip: newEventIp,
      type: newEventType,
      severity: newEventType === 'login_failed' ? 'medium' : newEventType === 'login_success' ? 'info' : 'high',
      details: newEventDetails,
      endpoint: '/api/v1/auth/login',
      location: { country: 'United States', countryCode: 'US', city: 'San Jose', lat: 37.3382, lng: -121.8863 },
      device: { browser: 'Chrome 122.0', os: 'Linux', userAgent: 'Mozilla/5.0 SecOps-Manual-Tester' },
      status: isIpBlocked(newEventIp) ? 'blocked' : 'allowed'
    });
    setShowAddEventModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search IP, username, MITRE ID, location, details..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls (Segmented interactive buttons) */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Filter Types */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-md border border-slate-800 text-xs">
            <button
              onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${selectedType === 'all' ? 'bg-slate-800 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All Events
            </button>
            <button
              onClick={() => { setSelectedType('failed'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${selectedType === 'failed' ? 'bg-slate-800 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Failed Logins
            </button>
            <button
              onClick={() => { setSelectedType('threats'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${selectedType === 'threats' ? 'bg-slate-800 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              High Threats
            </button>
            <button
              onClick={() => { setSelectedType('success'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded transition-colors ${selectedType === 'success' ? 'bg-slate-800 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Successful
            </button>
          </div>

          {/* Severity Dropdown */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950/80 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Inject Manual Event CTA */}
          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Record Test Event</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono">
                <th className="py-3 px-4 font-medium">TIMESTAMP (UTC)</th>
                <th className="py-3 px-4 font-medium">SEVERITY</th>
                <th className="py-3 px-4 font-medium">EVENT TYPE</th>
                <th className="py-3 px-4 font-medium">USER IDENTITY</th>
                <th className="py-3 px-4 font-medium">IP ADDRESS & LOCATION</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium">DETAILS / MITRE</th>
                <th className="py-3 px-3 text-right font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No security events found matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => {
                  const blocked = isIpBlocked(event.ip);
                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap tabular-nums">
                        {formatTimestamp(event.timestamp)}
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={getSeverityStyle(event.severity)}>
                          {event.severity.toUpperCase()}
                        </span>
                      </td>

                      {/* Event Type */}
                      <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                        <span>{event.type.replace(/_/g, ' ')}</span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 text-cyan-300 font-medium whitespace-nowrap">
                        {event.username}
                      </td>

                      {/* IP & Location */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{event.ip}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400 font-sans text-[11px]">
                            {event.location.city}, {event.location.countryCode}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusIndicator(event.status, event.ip)}
                      </td>

                      {/* Details & MITRE */}
                      <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                        <div className="truncate" title={event.details}>
                          {event.details}
                        </div>
                        {event.mitreTechnique && (
                          <div className="text-[11px] font-mono text-rose-400 truncate mt-0.5">
                            {event.mitreTechnique}
                          </div>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!blocked ? (
                            <button
                              onClick={() => onBlockIp(event.ip, `Manual block triggered from activity log for ${event.username}`)}
                              className="px-2 py-1 text-[11px] font-sans font-medium text-rose-300 hover:bg-rose-950/60 rounded border border-rose-800/60 transition-colors"
                              title="Add IP to firewall quarantine blocklist"
                            >
                              Block IP
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500">Quarantined</span>
                          )}
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Inspect event payload"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredEvents.length)} of{' '}
            {filteredEvents.length} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-slate-300 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-slate-300 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Packet Inspector Modal Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">
                  Event Packet Inspector: {selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              {/* Summary Header */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200">{selectedEvent.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target User:</span>
                  <span className="text-cyan-300 font-bold">{selectedEvent.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Origin IP & Geo:</span>
                  <span className="text-slate-200">
                    {selectedEvent.ip} ({selectedEvent.location.city}, {selectedEvent.location.country})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Severity & Status:</span>
                  <div className="flex items-center gap-2">
                    <span className={getSeverityStyle(selectedEvent.severity)}>
                      {selectedEvent.severity.toUpperCase()}
                    </span>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    {getStatusIndicator(selectedEvent.status, selectedEvent.ip)}
                  </div>
                </div>
              </div>

              {/* MITRE ATT&CK Mapping */}
              {selectedEvent.mitreTechnique && (
                <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded">
                  <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5 mb-1 font-sans">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>MITRE ATT&CK Framework Correlation</span>
                  </div>
                  <div className="text-slate-200 font-bold">{selectedEvent.mitreTechnique}</div>
                </div>
              )}

              {/* Description */}
              <div>
                <div className="text-slate-400 mb-1 font-sans font-medium">Log Summary / Details:</div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 font-sans leading-relaxed">
                  {selectedEvent.details}
                </div>
              </div>

              {/* Client & Device Fingerprint */}
              <div>
                <div className="text-slate-400 mb-1 font-sans font-medium">Client Device & Telemetry:</div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 text-slate-300">
                  <div>User-Agent: {selectedEvent.device.userAgent}</div>
                  <div>Browser / Client: {selectedEvent.device.browser}</div>
                  <div>OS Platform: {selectedEvent.device.os}</div>
                  {selectedEvent.endpoint && <div>Target Endpoint: {selectedEvent.endpoint}</div>}
                  {selectedEvent.device.isVpnOrTor && (
                    <div className="text-amber-400">Anonymizer Flag: Tor / Commercial VPN Exit Node Detected</div>
                  )}
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1 font-sans font-medium">
                  <span className="text-slate-400">Raw Normalized Payload</span>
                  <button
                    onClick={() => handleCopyJson(selectedEvent)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedId === selectedEvent.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === selectedEvent.id ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto text-[11px] text-cyan-200 max-h-48 scrollbar-thin">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <div>
                {!isIpBlocked(selectedEvent.ip) ? (
                  <button
                    onClick={() => {
                      onBlockIp(selectedEvent.ip, `Quarantined after inspecting event ${selectedEvent.id}`);
                      setSelectedEvent(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Quarantine IP {selectedEvent.ip}</span>
                  </button>
                ) : (
                  <span className="text-xs text-rose-400 font-mono">IP already in quarantine</span>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Test Event Injection Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Record Security Event</span>
              </h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomEventSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Username / Identity</label>
                <input
                  type="text"
                  required
                  value={newEventUser}
                  onChange={(e) => setNewEventUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Source IP Address</label>
                <input
                  type="text"
                  required
                  value={newEventIp}
                  onChange={(e) => setNewEventIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Type</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as EventType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="login_failed">Login Failed (Auth gate rejection)</option>
                  <option value="login_success">Login Success (Valid session)</option>
                  <option value="brute_force_spike">Brute Force Spike</option>
                  <option value="mfa_denied">MFA Prompt Denied</option>
                  <option value="privilege_escalation">Privilege Escalation Probe</option>
                  <option value="impossible_travel">Impossible Travel Anomaly</option>
                  <option value="port_scan">Port & Vulnerability Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Details / Log Message</label>
                <textarea
                  rows={2}
                  required
                  value={newEventDetails}
                  onChange={(e) => setNewEventDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                >
                  Submit & Evaluate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

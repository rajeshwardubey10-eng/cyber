import {
  SecurityEvent,
  SecurityAlert,
  DetectionRule,
  BlockedIp,
  SecurityStats,
  HourlyTimelinePoint,
  EventType,
  Severity,
  EventStatus
} from '../types/security';
import { INITIAL_EVENTS, INITIAL_ALERTS, INITIAL_BLOCKED_IPS, INITIAL_RULES } from './seedData';

const STORAGE_KEYS = {
  EVENTS: 'secops_events_v1',
  ALERTS: 'secops_alerts_v1',
  BLOCKED_IPS: 'secops_blocked_ips_v1',
  RULES: 'secops_rules_v1'
};

class SecurityEngine {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private blockedIps: BlockedIp[] = [];
  private rules: DetectionRule[] = [];
  private listeners: Set<() => void> = new Set();
  private streamTimer: NodeJS.Timeout | null = null;
  private isStreaming: boolean = true;

  constructor() {
    this.loadState();
    this.startLiveStream();
  }

  private loadState() {
    try {
      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const storedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      const storedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED_IPS);
      const storedRules = localStorage.getItem(STORAGE_KEYS.RULES);

      this.events = storedEvents ? JSON.parse(storedEvents) : [...INITIAL_EVENTS];
      this.alerts = storedAlerts ? JSON.parse(storedAlerts) : [...INITIAL_ALERTS];
      this.blockedIps = storedBlocked ? JSON.parse(storedBlocked) : [...INITIAL_BLOCKED_IPS];
      this.rules = storedRules ? JSON.parse(storedRules) : [...INITIAL_RULES];
    } catch {
      this.events = [...INITIAL_EVENTS];
      this.alerts = [...INITIAL_ALERTS];
      this.blockedIps = [...INITIAL_BLOCKED_IPS];
      this.rules = [...INITIAL_RULES];
    }
  }

  private persistState() {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_KEYS.BLOCKED_IPS, JSON.stringify(this.blockedIps));
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(this.rules));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getAlerts(): SecurityAlert[] {
    return [...this.alerts].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  public getBlockedIps(): BlockedIp[] {
    return [...this.blockedIps];
  }

  public getRules(): DetectionRule[] {
    return [...this.rules];
  }

  public isIpBlocked(ip: string): boolean {
    return this.blockedIps.some((item) => item.ip === ip);
  }

  public getStats(): SecurityStats {
    const now = Date.now();
    const past24h = now - 24 * 3600 * 1000;
    const events24h = this.events.filter((e) => new Date(e.timestamp).getTime() >= past24h);

    const totalEvents24h = events24h.length;
    const failedLogins24h = events24h.filter(
      (e) => e.type === 'login_failed' || e.type === 'brute_force_spike' || e.type === 'password_spray'
    ).length;
    const successfulLogins24h = events24h.filter((e) => e.type === 'login_success').length;

    const totalLogins = failedLogins24h + successfulLogins24h;
    const failedLoginRate = totalLogins > 0 ? Math.round((failedLogins24h / totalLogins) * 100) : 0;

    const activeAlerts = this.alerts.filter((a) => a.status === 'active' || a.status === 'investigating');
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

    // Dynamic Threat Score formula:
    // Base 15 + (critical * 20) + (high * 10) + (medium * 4) + (failedRate * 0.4)
    const highAlerts = activeAlerts.filter((a) => a.severity === 'high');
    const medAlerts = activeAlerts.filter((a) => a.severity === 'medium');

    let calculatedScore = Math.min(
      99,
      Math.max(
        12,
        Math.round(
          15 +
            criticalAlerts.length * 22 +
            highAlerts.length * 12 +
            medAlerts.length * 4 +
            failedLoginRate * 0.35
        )
      )
    );

    const uniqueUsers = new Set(this.events.map((e) => e.username)).size;

    return {
      totalEvents24h,
      failedLogins24h,
      successfulLogins24h,
      failedLoginRate,
      activeAlertsCount: activeAlerts.length,
      criticalAlertsCount: criticalAlerts.length,
      blockedIpsCount: this.blockedIps.length,
      threatScore: calculatedScore,
      threatScoreTrend: calculatedScore > 65 ? 'up' : calculatedScore > 40 ? 'stable' : 'down',
      monitoredUsersCount: Math.max(uniqueUsers, 14)
    };
  }

  public getHourlyTimeline(): HourlyTimelinePoint[] {
    const points: HourlyTimelinePoint[] = [];
    const now = new Date();

    // Past 12 hourly buckets
    for (let i = 11; i >= 0; i--) {
      const bucketEnd = new Date(now.getTime() - i * 3600 * 1000);
      const bucketStart = new Date(now.getTime() - (i + 1) * 3600 * 1000);

      const bucketEvents = this.events.filter((e) => {
        const time = new Date(e.timestamp).getTime();
        return time >= bucketStart.getTime() && time < bucketEnd.getTime();
      });

      const successCount = bucketEvents.filter((e) => e.type === 'login_success').length;
      const failedCount = bucketEvents.filter(
        (e) => e.type === 'login_failed' || e.type === 'brute_force_spike' || e.type === 'password_spray'
      ).length;
      const threatCount = bucketEvents.filter(
        (e) => e.severity === 'critical' || e.severity === 'high'
      ).length;

      const hourNumber = bucketEnd.getHours();
      const displayTime = `${hourNumber.toString().padStart(2, '0')}:00`;

      points.push({
        hour: bucketEnd.toISOString(),
        displayTime,
        successCount,
        failedCount,
        threatCount
      });
    }

    return points;
  }

  public addEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp'> & { timestamp?: string }): SecurityEvent {
    const isBlocked = this.isIpBlocked(eventData.ip);
    const newEvent: SecurityEvent = {
      ...eventData,
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: eventData.timestamp || new Date().toISOString(),
      status: isBlocked ? 'blocked' : eventData.status
    };

    this.events.unshift(newEvent);

    // Keep memory clean, cap to last 250 events
    if (this.events.length > 250) {
      this.events = this.events.slice(0, 250);
    }

    // Run correlation detection
    this.evaluateRulesForEvent(newEvent);
    this.persistState();
    return newEvent;
  }

  private evaluateRulesForEvent(event: SecurityEvent) {
    const now = new Date(event.timestamp).getTime();

    // 1. Brute Force Rule
    const bruteRule = this.rules.find((r) => r.id === 'rule-brute-force');
    if (bruteRule && bruteRule.enabled && (event.type === 'login_failed' || event.type === 'brute_force_spike')) {
      const windowMs = bruteRule.windowMinutes * 60 * 1000;
      const recentFails = this.events.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return (
          t >= now - windowMs &&
          (e.type === 'login_failed' || e.type === 'brute_force_spike') &&
          (e.ip === event.ip || e.username === event.username)
        );
      });

      if (recentFails.length >= bruteRule.threshold) {
        this.raiseAlert({
          ruleId: bruteRule.id,
          ruleName: bruteRule.name,
          severity: bruteRule.severity,
          targetUser: event.username,
          targetIp: event.ip,
          summary: `High-frequency failed logins: ${recentFails.length} failed attempts detected within ${bruteRule.windowMinutes} minutes for user '${event.username}' from ${event.ip}.`,
          mitreTechnique: 'T1110.001 - Password Guessing',
          eventCount: recentFails.length,
          associatedEventIds: recentFails.slice(0, 5).map((e) => e.id),
          remediation: bruteRule.autoAction === 'block_ip'
            ? `IP address ${event.ip} automatically quarantined in perimeter blocklist.`
            : 'Review authentication failure source and consider immediate IP perimeter blocking.'
        });

        if (bruteRule.autoAction === 'block_ip' && !this.isIpBlocked(event.ip)) {
          this.blockIp(event.ip, `Automated rule containment: Brute force attack against ${event.username}`, true);
        }
      }
    }

    // 2. Impossible Travel
    const travelRule = this.rules.find((r) => r.id === 'rule-impossible-travel');
    if (travelRule && travelRule.enabled && event.type === 'impossible_travel') {
      this.raiseAlert({
        ruleId: travelRule.id,
        ruleName: travelRule.name,
        severity: travelRule.severity,
        targetUser: event.username,
        targetIp: event.ip,
        summary: `Impossible geographical velocity flagged for '${event.username}'. Login detected in ${event.location.city}, ${event.location.country}.`,
        mitreTechnique: 'T1078.004 - Cloud Valid Accounts',
        eventCount: 1,
        associatedEventIds: [event.id],
        remediation: 'Immediately revoke active sessions and enforce mandatory MFA hardware token re-verification.'
      });
    }

    // 3. Credential Stuffing / Password Spray
    const sprayRule = this.rules.find((r) => r.id === 'rule-credential-stuffing');
    if (sprayRule && sprayRule.enabled && event.type === 'password_spray') {
      this.raiseAlert({
        ruleId: sprayRule.id,
        ruleName: sprayRule.name,
        severity: sprayRule.severity,
        targetUser: event.username,
        targetIp: event.ip,
        summary: `Credential stuffing campaign detected originating from ${event.ip} probing multiple enterprise user accounts.`,
        mitreTechnique: 'T1110.003 - Password Spraying',
        eventCount: 4,
        associatedEventIds: [event.id],
        remediation: 'Enforce rate-limiting on login gateway and block source ASN or IP address.'
      });

      if (sprayRule.autoAction === 'block_ip' && !this.isIpBlocked(event.ip)) {
        this.blockIp(event.ip, 'Credential stuffing campaign detected across multiple accounts', true);
      }
    }

    // 4. Privilege Escalation
    const privRule = this.rules.find((r) => r.id === 'rule-privilege-escalation');
    if (privRule && privRule.enabled && event.type === 'privilege_escalation') {
      this.raiseAlert({
        ruleId: privRule.id,
        ruleName: privRule.name,
        severity: privRule.severity,
        targetUser: event.username,
        targetIp: event.ip,
        summary: `Privilege escalation attempt: Account '${event.username}' triggered unauthorized administrative endpoint '${event.endpoint || '/admin'}'.`,
        mitreTechnique: 'T1068 - Exploitation for Privilege Escalation',
        eventCount: 1,
        associatedEventIds: [event.id],
        remediation: 'Account immediately placed under security quarantine and token revoked.'
      });
    }
  }

  private raiseAlert(alertData: Omit<SecurityAlert, 'id' | 'detectedAt' | 'status'>) {
    // Avoid duplicate alert within 2 minutes for same target user and rule
    const existing = this.alerts.find(
      (a) =>
        a.ruleId === alertData.ruleId &&
        a.targetUser === alertData.targetUser &&
        a.status === 'active' &&
        Date.now() - new Date(a.detectedAt).getTime() < 120 * 1000
    );

    if (existing) {
      existing.eventCount += alertData.eventCount;
      existing.associatedEventIds = Array.from(
        new Set([...existing.associatedEventIds, ...alertData.associatedEventIds])
      );
      this.persistState();
      return;
    }

    const newAlert: SecurityAlert = {
      ...alertData,
      id: `alt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'active',
      detectedAt: new Date().toISOString()
    };

    this.alerts.unshift(newAlert);
    this.persistState();
  }

  public updateAlertStatus(alertId: string, status: SecurityAlert['status'], resolutionNotes?: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = status;
      if (resolutionNotes) {
        alert.resolutionNotes = resolutionNotes;
      }
      this.persistState();
    }
  }

  public blockIp(ip: string, reason: string, autoBlocked = false) {
    if (this.isIpBlocked(ip)) return;

    // Find geo info from recent events if available
    const matchedEvent = this.events.find((e) => e.ip === ip);
    const country = matchedEvent?.location.country || 'Unknown';
    const city = matchedEvent?.location.city || 'Unknown';

    const newBlocked: BlockedIp = {
      ip,
      reason,
      blockedAt: new Date().toISOString(),
      country,
      city,
      autoBlocked,
      riskScore: Math.floor(Math.random() * 15) + 85
    };

    this.blockedIps.unshift(newBlocked);

    // Update statuses of existing events matching this IP
    this.events = this.events.map((e) => (e.ip === ip ? { ...e, status: 'blocked' } : e));
    this.persistState();
  }

  public unblockIp(ip: string) {
    this.blockedIps = this.blockedIps.filter((item) => item.ip !== ip);
    this.persistState();
  }

  public updateRule(ruleId: string, updates: Partial<DetectionRule>) {
    this.rules = this.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    this.persistState();
  }

  public resetToDefaults() {
    this.events = [...INITIAL_EVENTS];
    this.alerts = [...INITIAL_ALERTS];
    this.blockedIps = [...INITIAL_BLOCKED_IPS];
    this.rules = [...INITIAL_RULES];
    this.persistState();
  }

  // --- Live Stream Simulator ---
  public toggleLiveStream(enabled?: boolean) {
    this.isStreaming = enabled !== undefined ? enabled : !this.isStreaming;
    if (this.isStreaming) {
      this.startLiveStream();
    } else {
      if (this.streamTimer) {
        clearInterval(this.streamTimer);
        this.streamTimer = null;
      }
    }
    this.notify();
    return this.isStreaming;
  }

  public isStreamActive() {
    return this.isStreaming;
  }

  private startLiveStream() {
    if (this.streamTimer) clearInterval(this.streamTimer);

    // Generates a random realistic event every 6-9 seconds
    this.streamTimer = setInterval(() => {
      if (!this.isStreaming) return;
      this.generateRandomBackgroundEvent();
    }, 7000);
  }

  private generateRandomBackgroundEvent() {
    const users = [
      'alex.turner@company.internal',
      'sarah.engineer@company.internal',
      'david.kim@company.internal',
      'maria.gonzalez@company.internal',
      'brian.finance@company.internal',
      'service_k8s_worker',
      'billing_cron_job',
      'guest_consultant'
    ];

    const locations = [
      { country: 'United States', countryCode: 'US', city: 'Seattle', lat: 47.6062, lng: -122.3321, ip: '12.180.44.19' },
      { country: 'United States', countryCode: 'US', city: 'Austin', lat: 30.2672, lng: -97.7431, ip: '24.28.102.15' },
      { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.5074, lng: -0.1278, ip: '185.191.171.12' },
      { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, ip: '82.165.197.1' },
      { country: 'Canada', countryCode: 'CA', city: 'Toronto', lat: 43.6532, lng: -79.3832, ip: '198.51.100.42' },
      { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.6762, lng: 139.6503, ip: '133.242.18.99' }
    ];

    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const isFail = Math.random() < 0.25; // 25% chance of background failure

    if (isFail) {
      this.addEvent({
        type: 'login_failed',
        severity: 'low',
        username: randomUser,
        ip: randomLoc.ip,
        location: randomLoc,
        device: {
          browser: 'Chrome 122.0',
          os: 'macOS 14.3',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        status: 'flagged',
        details: 'Failed credential submission on single-sign-on portal (credential mismatch).',
        endpoint: '/api/v1/auth/login'
      });
    } else {
      this.addEvent({
        type: 'login_success',
        severity: 'info',
        username: randomUser,
        ip: randomLoc.ip,
        location: randomLoc,
        device: {
          browser: 'Chrome 122.0',
          os: 'macOS 14.3',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        status: 'allowed',
        details: 'User completed passwordless authentication with enterprise FIDO2 authenticator.',
        endpoint: '/api/v1/auth/callback'
      });
    }
  }

  // --- Attack Simulator Scenarios ---
  public runSimulation(scenario: 'brute_force' | 'credential_stuffing' | 'impossible_travel' | 'privilege_escalation' | 'benign_rush'): string {
    const timestamp = new Date().toISOString();

    switch (scenario) {
      case 'brute_force': {
        const attackerIp = '194.26.29.112';
        const target = 'root_admin';
        // Add 5 rapid failed attempts
        for (let i = 1; i <= 5; i++) {
          this.addEvent({
            type: 'login_failed',
            severity: 'high',
            username: target,
            ip: attackerIp,
            location: { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
            device: {
              browser: 'Hydra/9.5',
              os: 'Kali Linux',
              userAgent: 'Mozilla/5.0 (Hydra-v9.5-Brute)',
              isVpnOrTor: true
            },
            status: 'flagged',
            details: `Brute force password dictionary iteration #${i} for user '${target}'.`,
            mitreTechnique: 'T1110.001 - Password Guessing',
            endpoint: '/api/v1/auth/login'
          });
        }
        return `Simulated 5 rapid brute-force authentication attacks targeting '${target}' from ${attackerIp}. Rule engine triggered.`;
      }

      case 'credential_stuffing': {
        const attackerIp = '185.220.101.45';
        const victimAccounts = ['alice.dev', 'bob.sec', 'charlie.ops', 'diana.lead', 'edward.it'];
        victimAccounts.forEach((u, idx) => {
          this.addEvent({
            type: 'password_spray',
            severity: 'high',
            username: u,
            ip: attackerIp,
            location: { country: 'Russia', countryCode: 'RU', city: 'Moscow', lat: 55.7558, lng: 37.6173 },
            device: {
              browser: 'Python-Aiohttp/3.8',
              os: 'Linux',
              userAgent: 'Python-Aiohttp/3.8.4',
              isVpnOrTor: true
            },
            status: 'flagged',
            details: `Credential stuffing payload wave testing leaked combo list on account '${u}' (#${idx + 1}).`,
            mitreTechnique: 'T1110.003 - Password Spraying',
            endpoint: '/api/v1/auth/login'
          });
        });
        return `Simulated distributed credential stuffing across 5 accounts from ${attackerIp}.`;
      }

      case 'impossible_travel': {
        const user = 'elena.rodriguez@company.internal';
        // Event 1: Login in Berlin
        this.addEvent({
          type: 'login_success',
          severity: 'info',
          username: user,
          ip: '91.198.174.192',
          location: { country: 'Germany', countryCode: 'DE', city: 'Berlin', lat: 52.52, lng: 13.405 },
          device: { browser: 'Chrome 122', os: 'Windows 11', userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
          status: 'allowed',
          details: 'Legitimate morning corporate login from registered European office.',
          endpoint: '/api/v1/auth/login'
        });

        // Event 2: Immediate login from Sydney, Australia 4 minutes later
        this.addEvent({
          type: 'impossible_travel',
          severity: 'critical',
          username: user,
          ip: '139.130.4.5',
          location: { country: 'Australia', countryCode: 'AU', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
          device: { browser: 'Unknown-Client', os: 'Linux', userAgent: 'curl/8.2.1', isVpnOrTor: true },
          status: 'flagged',
          details: 'Physically impossible travel velocity detected: Berlin to Sydney (~16,000 km) in < 4 minutes.',
          mitreTechnique: 'T1078.004 - Cloud Valid Accounts',
          endpoint: '/api/v1/auth/session-refresh'
        });
        return `Simulated impossible travel anomaly for '${user}' (Berlin -> Sydney in 4 minutes).`;
      }

      case 'privilege_escalation': {
        const target = 'contractor_temp04';
        this.addEvent({
          type: 'privilege_escalation',
          severity: 'critical',
          username: target,
          ip: '82.165.197.1',
          location: { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
          device: { browser: 'PostmanRuntime/7.36', os: 'Linux', userAgent: 'PostmanRuntime/7.36.0' },
          status: 'flagged',
          details: 'Restricted role probe: attempted to grant superuser RBAC permissions via POST /api/v1/roles/admin.',
          mitreTechnique: 'T1068 - Exploitation for Privilege Escalation',
          endpoint: '/api/v1/roles/admin'
        });
        return `Simulated privilege escalation breach attempt by '${target}'.`;
      }

      case 'benign_rush': {
        const employees = ['alex.turner@company.internal', 'david.kim@company.internal', 'sarah.engineer@company.internal'];
        employees.forEach((emp) => {
          this.addEvent({
            type: 'login_success',
            severity: 'info',
            username: emp,
            ip: '12.180.44.19',
            location: { country: 'United States', countryCode: 'US', city: 'Seattle', lat: 47.6062, lng: -122.3321 },
            device: { browser: 'Chrome 122', os: 'macOS 14', userAgent: 'Mozilla/5.0' },
            status: 'allowed',
            details: 'Standard shift start SSO token refresh validated successfully.',
            endpoint: '/api/v1/auth/callback'
          });
        });
        return 'Injected 3 verified benign employee logins.';
      }
    }
  }

  // --- SQL Query Executor for SQLite Experience ---
  public executeSqlQuery(query: string): { columns: string[]; rows: any[]; error?: string; rowCount: number } {
    try {
      const q = query.trim().replace(/;$/, '');
      const lower = q.toLowerCase();

      if (!lower.startsWith('select')) {
        return {
          columns: ['status', 'message'],
          rows: [['READ_ONLY_GUARD', 'Only analytical SELECT queries are supported in this security sandbox.']],
          rowCount: 0
        };
      }

      // Check which table is referenced
      let sourceData: any[] = [];
      let tableName = '';

      if (lower.includes('from security_events') || lower.includes('from events')) {
        tableName = 'security_events';
        sourceData = this.events.map((e) => ({
          id: e.id,
          timestamp: e.timestamp,
          type: e.type,
          severity: e.severity,
          username: e.username,
          ip: e.ip,
          country: e.location.country,
          city: e.location.city,
          status: e.status,
          mitre_technique: e.mitreTechnique || 'N/A'
        }));
      } else if (lower.includes('from security_alerts') || lower.includes('from alerts')) {
        tableName = 'security_alerts';
        sourceData = this.alerts.map((a) => ({
          id: a.id,
          rule_name: a.ruleName,
          severity: a.severity,
          status: a.status,
          target_user: a.targetUser,
          target_ip: a.targetIp,
          detected_at: a.detectedAt,
          event_count: a.eventCount,
          mitre_technique: a.mitreTechnique
        }));
      } else if (lower.includes('from blocked_ips')) {
        tableName = 'blocked_ips';
        sourceData = this.blockedIps.map((b) => ({
          ip: b.ip,
          reason: b.reason,
          country: b.country,
          risk_score: b.riskScore,
          auto_blocked: b.autoBlocked ? 1 : 0,
          blocked_at: b.blockedAt
        }));
      } else if (lower.includes('from detection_rules') || lower.includes('from rules')) {
        tableName = 'detection_rules';
        sourceData = this.rules.map((r) => ({
          id: r.id,
          name: r.name,
          severity: r.severity,
          enabled: r.enabled ? 1 : 0,
          threshold: r.threshold,
          window_minutes: r.windowMinutes,
          category: r.category
        }));
      } else {
        return {
          columns: ['error'],
          rows: [[`Table not recognized. Available tables: 'security_events', 'security_alerts', 'blocked_ips', 'detection_rules'`]],
          rowCount: 0,
          error: 'Unknown table'
        };
      }

      // Filter handling (simple WHERE clauses)
      let filtered = [...sourceData];
      if (lower.includes('where')) {
        const whereIndex = lower.indexOf('where');
        const afterWhere = lower.slice(whereIndex + 5);
        
        if (afterWhere.includes("severity = 'critical'") || afterWhere.includes('severity="critical"')) {
          filtered = filtered.filter((r) => r.severity === 'critical');
        } else if (afterWhere.includes("severity = 'high'") || afterWhere.includes('severity="high"')) {
          filtered = filtered.filter((r) => r.severity === 'high');
        } else if (afterWhere.includes("type = 'login_failed'") || afterWhere.includes("type='login_failed'")) {
          filtered = filtered.filter((r) => r.type === 'login_failed');
        } else if (afterWhere.includes("status = 'active'") || afterWhere.includes("status='active'")) {
          filtered = filtered.filter((r) => r.status === 'active');
        } else if (afterWhere.includes("status = 'blocked'") || afterWhere.includes("status='blocked'")) {
          filtered = filtered.filter((r) => r.status === 'blocked');
        }
      }

      // GROUP BY Handling for aggregate queries like GROUP BY username, GROUP BY country, etc.
      if (lower.includes('group by username')) {
        const map: Record<string, number> = {};
        filtered.forEach((r) => {
          const user = r.username || r.target_user || 'unknown';
          map[user] = (map[user] || 0) + 1;
        });
        const rows = Object.entries(map).map(([user, count]) => [user, count]);
        return {
          columns: ['username', 'total_count'],
          rows,
          rowCount: rows.length
        };
      }

      if (lower.includes('group by country') || lower.includes('group by location')) {
        const map: Record<string, number> = {};
        filtered.forEach((r) => {
          const c = r.country || 'unknown';
          map[c] = (map[c] || 0) + 1;
        });
        const rows = Object.entries(map).map(([country, count]) => [country, count]);
        return {
          columns: ['country', 'event_count'],
          rows,
          rowCount: rows.length
        };
      }

      if (lower.includes('group by ip')) {
        const map: Record<string, number> = {};
        filtered.forEach((r) => {
          const ip = r.ip || r.target_ip || 'unknown';
          map[ip] = (map[ip] || 0) + 1;
        });
        const rows = Object.entries(map).map(([ip, count]) => [ip, count]);
        return {
          columns: ['ip_address', 'event_count'],
          rows,
          rowCount: rows.length
        };
      }

      // Limit handling
      let limit = 50;
      const limitMatch = lower.match(/limit\s+(\d+)/);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
      }
      const sliced = filtered.slice(0, limit);

      if (sliced.length === 0) {
        return {
          columns: ['result'],
          rows: [['0 rows returned for this query.']],
          rowCount: 0
        };
      }

      const columns = Object.keys(sliced[0]);
      const rows = sliced.map((item) => columns.map((col) => item[col]));

      return {
        columns,
        rows,
        rowCount: rows.length
      };
    } catch (err: any) {
      return {
        columns: ['error'],
        rows: [[err?.message || 'SQL execution error']],
        rowCount: 0,
        error: err?.message
      };
    }
  }
}

export const securityEngine = new SecurityEngine();

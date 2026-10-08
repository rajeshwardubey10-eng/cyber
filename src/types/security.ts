export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type EventType =
  | 'login_success'
  | 'login_failed'
  | 'brute_force_spike'
  | 'suspicious_geo'
  | 'impossible_travel'
  | 'privilege_escalation'
  | 'token_leak'
  | 'password_spray'
  | 'mfa_denied'
  | 'port_scan';

export type EventStatus = 'allowed' | 'flagged' | 'blocked';

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  userAgent: string;
  isVpnOrTor?: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: string; // ISO string
  type: EventType;
  severity: Severity;
  username: string;
  ip: string;
  location: GeoLocation;
  device: DeviceInfo;
  status: EventStatus;
  details: string;
  mitreTechnique?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export type AlertStatus = 'active' | 'investigating' | 'resolved' | 'dismissed';

export interface SecurityAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  status: AlertStatus;
  detectedAt: string;
  targetUser: string;
  targetIp: string;
  summary: string;
  mitreTechnique: string;
  eventCount: number;
  associatedEventIds: string[];
  remediation: string;
  resolutionNotes?: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  threshold: number;
  windowMinutes: number;
  category: 'authentication' | 'geography' | 'authorization' | 'network';
  autoAction: 'block_ip' | 'alert_only' | 'revoke_session';
}

export interface BlockedIp {
  ip: string;
  reason: string;
  blockedAt: string;
  country: string;
  city: string;
  autoBlocked: boolean;
  riskScore: number;
}

export interface SecurityStats {
  totalEvents24h: number;
  failedLogins24h: number;
  successfulLogins24h: number;
  failedLoginRate: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  blockedIpsCount: number;
  threatScore: number; // 0 - 100
  threatScoreTrend: 'up' | 'down' | 'stable';
  monitoredUsersCount: number;
}

export interface HourlyTimelinePoint {
  hour: string;
  displayTime: string;
  successCount: number;
  failedCount: number;
  threatCount: number;
}

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export type ScanType = 'nmap' | 'openvas' | 'combined';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Scan {
  id: string;
  target: string;
  scanType: ScanType;
  status: ScanStatus;
  startedAt?: string;
  finishedAt?: string;
  criticalCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface StartScanRequest {
  target: string;
  scanType: ScanType;
}

export type ScheduleFrequency = 'once' | 'daily' | 'weekly';

export interface ScanSchedule {
  id: string;
  target: string;
  scanType: ScanType;
  frequency: ScheduleFrequency;
  nextRunAt: string;
  enabled: boolean;
}

export interface CreateScheduleRequest {
  target: string;
  scanType: ScanType;
  frequency: ScheduleFrequency;
  nextRunAt: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface MitigationRecommendation {
  id: string;
  title: string;
  description: string;
}

export interface NvdDetails {
  cveId: string;
  cvssScore?: number;
  description: string;
  referenceUrl: string;
}

export interface Vulnerability {
  id: string;
  scanId: string;
  title: string;
  severity: Severity;
  cve?: string;
  summary: string;
  recommendations: MitigationRecommendation[];
  nvd?: NvdDetails;
}

export interface DashboardStats {
  totalVulnerabilities: number;
  critical: number;
  medium: number;
  low: number;
  lastScanAt: string | null;
  lastScanId: string | null;
}

export interface ScanListFilters {
  fromDate?: string;
  toDate?: string;
  scanType?: ScanType | 'all';
}

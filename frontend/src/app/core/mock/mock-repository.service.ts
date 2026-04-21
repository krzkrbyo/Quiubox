import { Injectable } from '@angular/core';
import {
  INITIAL_SCHEDULES,
  INITIAL_SCANS,
  INITIAL_VULNERABILITIES,
  MOCK_USERS,
} from './initial-mock-data';
import type { Scan, ScanSchedule, ScanType, User, Vulnerability } from '../models/domain.models';

function cloneScans(): Scan[] {
  return INITIAL_SCANS.map((s) => ({ ...s }));
}

function cloneSchedules(): ScanSchedule[] {
  return INITIAL_SCHEDULES.map((s) => ({ ...s }));
}

function cloneVulns(): Vulnerability[] {
  return INITIAL_VULNERABILITIES.map((v) => ({
    ...v,
    recommendations: v.recommendations.map((r) => ({ ...r })),
    nvd: v.nvd ? { ...v.nvd } : undefined,
  }));
}

function cloneUsers(): User[] {
  return MOCK_USERS.map((u) => ({ ...u }));
}

@Injectable({ providedIn: 'root' })
export class MockRepositoryService {
  readonly scans = cloneScans();
  readonly schedules = cloneSchedules();
  readonly vulnerabilities = cloneVulns();
  readonly users = cloneUsers();

  nextId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  findScan(id: string): Scan | undefined {
    return this.scans.find((s) => s.id === id);
  }

  findVulnerability(scanId: string, vulnId: string): Vulnerability | undefined {
    return this.vulnerabilities.find((v) => v.scanId === scanId && v.id === vulnId);
  }

  addVulnerabilitiesForScan(scanId: string, scanType: ScanType): void {
    const severityRoll = scanType === 'nmap' ? 'medium' : 'critical';
    const v1: Vulnerability = {
      id: this.nextId('vuln'),
      scanId,
      title: `Hallazgo generado (${scanType})`,
      severity: severityRoll,
      cve: 'CVE-2024-MOCK',
      summary: 'Vulnerabilidad simulada tras el escaneo en modo mock.',
      recommendations: [
        {
          id: this.nextId('rec'),
          title: 'Parcheo y endurecimiento',
          description: 'Aplicar actualizaciones de seguridad y revisar la configuración del servicio.',
        },
      ],
      nvd: {
        cveId: 'CVE-2024-MOCK',
        cvssScore: severityRoll === 'critical' ? 9.1 : 5.4,
        description: 'Entrada NVD simulada para demostración.',
        referenceUrl: 'https://nvd.nist.gov/',
      },
    };
    this.vulnerabilities.push(v1);
    this.recalculateScanCounts(scanId);
  }

  private recalculateScanCounts(scanId: string): void {
    const scan = this.findScan(scanId);
    if (!scan) {
      return;
    }
    const list = this.vulnerabilities.filter((v) => v.scanId === scanId);
    scan.criticalCount = list.filter((v) => v.severity === 'critical' || v.severity === 'high').length;
    scan.mediumCount = list.filter((v) => v.severity === 'medium').length;
    scan.lowCount = list.filter((v) => v.severity === 'low').length;
  }
}

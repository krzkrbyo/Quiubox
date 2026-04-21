import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { DashboardStats } from '../models/domain.models';
import { MockRepositoryService } from '../mock/mock-repository.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly mockRepo = inject(MockRepositoryService);

  getStats(): Observable<DashboardStats> {
    if (environment.useMock) {
      return of(this.computeFromMock());
    }
    return this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`);
  }

  private computeFromMock(): DashboardStats {
    const vulns = this.mockRepo.vulnerabilities;
    let critical = 0;
    let medium = 0;
    let low = 0;
    for (const v of vulns) {
      if (v.severity === 'critical' || v.severity === 'high') {
        critical += 1;
      } else if (v.severity === 'medium') {
        medium += 1;
      } else {
        low += 1;
      }
    }
    const completed = this.mockRepo.scans
      .filter((s) => s.status === 'completed' && s.finishedAt)
      .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
    const last = completed[0];
    return {
      totalVulnerabilities: vulns.length,
      critical,
      medium,
      low,
      lastScanAt: last?.finishedAt ?? null,
      lastScanId: last?.id ?? null,
    };
  }
}

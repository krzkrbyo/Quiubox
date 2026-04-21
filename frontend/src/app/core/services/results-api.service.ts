import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Scan, ScanListFilters, Vulnerability } from '../models/domain.models';
import { MockRepositoryService } from '../mock/mock-repository.service';

@Injectable({ providedIn: 'root' })
export class ResultsApiService {
  private readonly http = inject(HttpClient);
  private readonly mockRepo = inject(MockRepositoryService);

  listScansWithFilters(filters: ScanListFilters): Observable<Scan[]> {
    if (environment.useMock) {
      let list = [...this.mockRepo.scans].filter((s) => s.status === 'completed');
      if (filters.scanType && filters.scanType !== 'all') {
        list = list.filter((s) => s.scanType === filters.scanType);
      }
      if (filters.fromDate) {
        const from = filters.fromDate;
        list = list.filter((s) => (s.finishedAt ?? s.startedAt ?? '') >= from);
      }
      if (filters.toDate) {
        const to = filters.toDate;
        list = list.filter((s) => (s.finishedAt ?? s.startedAt ?? '') <= `${to}T23:59:59.999Z`);
      }
      list.sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
      return of(list);
    }
    let params = new HttpParams();
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    if (filters.scanType && filters.scanType !== 'all') {
      params = params.set('scanType', filters.scanType);
    }
    return this.http.get<Scan[]>(`${environment.apiUrl}/results/scans`, { params });
  }

  getVulnerabilitiesForScan(scanId: string): Observable<Vulnerability[]> {
    if (environment.useMock) {
      const list = this.mockRepo.vulnerabilities
        .filter((v) => v.scanId === scanId)
        .map((v) => ({
          ...v,
          recommendations: v.recommendations.map((r) => ({ ...r })),
          nvd: v.nvd ? { ...v.nvd } : undefined,
        }));
      return of(list);
    }
    return this.http.get<Vulnerability[]>(`${environment.apiUrl}/results/scans/${scanId}/vulnerabilities`);
  }

  getVulnerability(scanId: string, vulnId: string): Observable<Vulnerability> {
    if (environment.useMock) {
      const v = this.mockRepo.findVulnerability(scanId, vulnId);
      if (!v) {
        return throwError(() => new Error('Vulnerabilidad no encontrada'));
      }
      return of({
        ...v,
        recommendations: v.recommendations.map((r) => ({ ...r })),
        nvd: v.nvd ? { ...v.nvd } : undefined,
      });
    }
    return this.http.get<Vulnerability>(`${environment.apiUrl}/results/scans/${scanId}/vulnerabilities/${vulnId}`);
  }

  /** Opcional: refrescar datos NVD desde backend cuando no sea mock */
  refreshNvd(scanId: string, vulnId: string): Observable<Vulnerability> {
    if (environment.useMock) {
      return this.getVulnerability(scanId, vulnId);
    }
    return this.http.post<Vulnerability>(
      `${environment.apiUrl}/results/scans/${scanId}/vulnerabilities/${vulnId}/nvd/refresh`,
      {},
    );
  }
}

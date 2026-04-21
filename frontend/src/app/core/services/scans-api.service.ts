import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  CreateScheduleRequest,
  Scan,
  ScanSchedule,
  StartScanRequest,
} from '../models/domain.models';
import { MockRepositoryService } from '../mock/mock-repository.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ScansApiService {
  private readonly http = inject(HttpClient);
  private readonly mockRepo = inject(MockRepositoryService);
  private readonly notifications = inject(NotificationService);

  listScans(): Observable<Scan[]> {
    if (environment.useMock) {
      return of([...this.mockRepo.scans].sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? '')));
    }
    return this.http.get<Scan[]>(`${environment.apiUrl}/scans`);
  }

  getScan(id: string): Observable<Scan> {
    if (environment.useMock) {
      const s = this.mockRepo.findScan(id);
      if (!s) {
        return throwError(() => new Error('Escaneo no encontrado'));
      }
      return of({ ...s });
    }
    return this.http.get<Scan>(`${environment.apiUrl}/scans/${id}`);
  }

  startScan(req: StartScanRequest): Observable<Scan> {
    if (environment.useMock) {
      const id = this.mockRepo.nextId('scan');
      const scan: Scan = {
        id,
        target: req.target.trim(),
        scanType: req.scanType,
        status: 'queued',
        startedAt: new Date().toISOString(),
        criticalCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
      this.mockRepo.scans.unshift(scan);
      this.simulateScan(scan.id, req.scanType);
      return of({ ...scan }).pipe(delay(200));
    }
    return this.http.post<Scan>(`${environment.apiUrl}/scans`, req);
  }

  listSchedules(): Observable<ScanSchedule[]> {
    if (environment.useMock) {
      return of([...this.mockRepo.schedules]);
    }
    return this.http.get<ScanSchedule[]>(`${environment.apiUrl}/scans/schedules`);
  }

  createSchedule(req: CreateScheduleRequest): Observable<ScanSchedule> {
    if (environment.useMock) {
      const sch: ScanSchedule = {
        id: this.mockRepo.nextId('sch'),
        target: req.target.trim(),
        scanType: req.scanType,
        frequency: req.frequency,
        nextRunAt: req.nextRunAt,
        enabled: true,
      };
      this.mockRepo.schedules.push(sch);
      return of({ ...sch }).pipe(delay(150));
    }
    return this.http.post<ScanSchedule>(`${environment.apiUrl}/scans/schedules`, req);
  }

  deleteSchedule(id: string): Observable<void> {
    if (environment.useMock) {
      const idx = this.mockRepo.schedules.findIndex((s) => s.id === id);
      if (idx >= 0) {
        this.mockRepo.schedules.splice(idx, 1);
      }
      return of(undefined).pipe(delay(100));
    }
    return this.http.delete<void>(`${environment.apiUrl}/scans/schedules/${id}`);
  }

  private simulateScan(scanId: string, scanType: Scan['scanType']): void {
    const scan = this.mockRepo.findScan(scanId);
    if (!scan) {
      return;
    }
    scan.status = 'running';
    window.setTimeout(() => {
      const s = this.mockRepo.findScan(scanId);
      if (!s) {
        return;
      }
      s.status = 'completed';
      s.finishedAt = new Date().toISOString();
      this.mockRepo.addVulnerabilitiesForScan(scanId, scanType);
      const updated = this.mockRepo.findScan(scanId);
      const critical = updated?.criticalCount ?? 0;
      this.notifications.scanFinished(scanId, critical);
    }, 2200);
  }
}

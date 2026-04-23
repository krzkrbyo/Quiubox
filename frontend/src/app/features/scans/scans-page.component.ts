import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { interval, merge, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { Scan, ScanSchedule, ScanType } from '../../core/models/domain.models';
import { NotificationService } from '../../core/services/notification.service';
import { ScanEventsService } from '../../core/services/scan-events.service';
import { ScansApiService } from '../../core/services/scans-api.service';

@Component({
  selector: 'app-scans-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './scans-page.component.html',
  styleUrl: './scans-page.component.scss',
})
export class ScansPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly scansApi = inject(ScansApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly scanEvents = inject(ScanEventsService);
  private readonly notifications = inject(NotificationService);

  readonly manualForm = this.fb.nonNullable.group({
    target: ['', [Validators.required]],
    scanType: ['combined' as ScanType, [Validators.required]],
  });

  readonly scheduleForm = this.fb.nonNullable.group({
    target: ['', [Validators.required]],
    scanType: ['openvas' as ScanType, [Validators.required]],
    frequency: ['weekly' as 'once' | 'daily' | 'weekly', [Validators.required]],
    nextRunAt: ['', [Validators.required]],
  });

  scans: Scan[] = [];
  schedules: ScanSchedule[] = [];
  loadingList = true;
  starting = false;
  scheduling = false;
  demoScan: Scan | null = null;

  private readonly refresh$ = new Subject<void>();

  readonly displayedColumns = ['target', 'scanType', 'status', 'startedAt', 'finishedAt', 'counts'];

  openManualDialog(template: TemplateRef<unknown>): void {
    this.dialog.open(template, {
      width: 'min(440px, calc(100vw - 2rem))',
      panelClass: 'qb-dialog-panel',
    });
  }

  openScheduleDialog(template: TemplateRef<unknown>): void {
    this.dialog.open(template, {
      width: 'min(560px, calc(100vw - 2rem))',
      panelClass: 'qb-dialog-panel',
    });
  }

  ngOnInit(): void {
    this.scansApi.listSchedules().subscribe((s) => (this.schedules = s));
    merge(of(null), interval(3000), this.refresh$)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.scansApi.listScans()),
      )
      .subscribe({
        next: (list) => {
          this.scans = list;
          this.loadingList = false;
        },
        error: () => {
          this.loadingList = false;
        },
      });

    this.scanEvents
      .scanFinished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.demoScan = null;
          this.notifications.scanFinished(event.scanId, event.criticalCount);
          this.refresh$.next();
        },
        error: () => undefined,
      });
  }

  startManual(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }
    this.starting = true;
    const { target, scanType } = this.manualForm.getRawValue();
    this.scansApi.startScan({ target, scanType }).subscribe({
      next: (scan) => {
        this.demoScan = scan;
        this.starting = false;
        this.dialog.closeAll();
        this.refresh$.next();
      },
      error: () => {
        this.starting = false;
      },
    });
  }

  submitSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    const raw = this.scheduleForm.getRawValue();
    const nextRunAt = new Date(raw.nextRunAt).toISOString();
    this.scheduling = true;
    this.scansApi
      .createSchedule({
        target: raw.target,
        scanType: raw.scanType,
        frequency: raw.frequency,
        nextRunAt,
      })
      .subscribe({
        next: () => {
          this.scheduling = false;
          this.dialog.closeAll();
          this.scansApi.listSchedules().subscribe((s) => (this.schedules = s));
          this.scheduleForm.reset({
            target: '',
            scanType: 'openvas',
            frequency: 'weekly',
            nextRunAt: '',
          });
        },
        error: () => {
          this.scheduling = false;
        },
      });
  }

  deleteSchedule(id: string): void {
    this.scansApi.deleteSchedule(id).subscribe(() => {
      this.scansApi.listSchedules().subscribe((s) => (this.schedules = s));
    });
  }

  statusLabel(s: Scan['status']): string {
    switch (s) {
      case 'queued':
        return 'En cola';
      case 'running':
        return 'En ejecución';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return s;
    }
  }

  scanTypeLabel(t: ScanType): string {
    switch (t) {
      case 'nmap':
        return 'Nmap (puertos)';
      case 'openvas':
        return 'OpenVAS';
      case 'combined':
        return 'Combinado';
      default:
        return t;
    }
  }

}

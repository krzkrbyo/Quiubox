import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import type { Scan, Severity, Vulnerability } from '../../core/models/domain.models';
import { PdfService } from '../../core/services/pdf.service';
import { ResultsApiService } from '../../core/services/results-api.service';
import { ScansApiService } from '../../core/services/scans-api.service';
import { SeverityBadgeComponent } from '../../shared/severity-badge/severity-badge.component';

@Component({
  selector: 'app-scan-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, SeverityBadgeComponent],
  templateUrl: './scan-detail-page.component.html',
  styleUrl: './scan-detail-page.component.scss',
})
export class ScanDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly scansApi = inject(ScansApiService);
  private readonly resultsApi = inject(ResultsApiService);
  private readonly pdf = inject(PdfService);

  @ViewChild('pdfArea') pdfArea?: ElementRef<HTMLElement>;

  scan: Scan | null = null;
  vulns: Vulnerability[] = [];
  loading = true;
  exporting = false;

  readonly order: Severity[] = ['critical', 'high', 'medium', 'low'];

  constructor() {
    const id = this.route.snapshot.paramMap.get('scanId');
    if (!id) {
      this.loading = false;
      return;
    }
    forkJoin({
      scan: this.scansApi.getScan(id),
      vulns: this.resultsApi.getVulnerabilitiesForScan(id),
    }).subscribe({
      next: ({ scan, vulns }) => {
        this.scan = scan;
        this.vulns = vulns;
        this.loading = false;
      },
      error: () => {
        this.scan = null;
        this.loading = false;
      },
    });
  }

  bySeverity(sev: Severity): Vulnerability[] {
    return this.vulns.filter((v) => v.severity === sev);
  }

  severityHeading(sev: Severity): string {
    switch (sev) {
      case 'critical':
        return 'Críticas';
      case 'high':
        return 'Altas';
      case 'medium':
        return 'Medias';
      case 'low':
        return 'Bajas';
      default:
        return sev;
    }
  }

  async exportPdf(): Promise<void> {
    const el = this.pdfArea?.nativeElement;
    if (!el) {
      return;
    }
    this.exporting = true;
    try {
      await this.pdf.exportElement(el, `quiubox-escaneo-${this.scan?.id ?? 'scan'}.pdf`);
    } finally {
      this.exporting = false;
    }
  }
}

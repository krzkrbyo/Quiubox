import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import type { Scan, ScanListFilters, ScanType } from '../../core/models/domain.models';
import { PdfService } from '../../core/services/pdf.service';
import { ResultsApiService } from '../../core/services/results-api.service';

@Component({
  selector: 'app-results-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './results-list-page.component.html',
  styleUrl: './results-list-page.component.scss',
})
export class ResultsListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resultsApi = inject(ResultsApiService);
  private readonly pdf = inject(PdfService);

  @ViewChild('pdfArea') pdfArea?: ElementRef<HTMLElement>;

  readonly filterForm = this.fb.nonNullable.group({
    fromDate: [''],
    toDate: [''],
    scanType: ['all' as ScanType | 'all'],
  });

  scans: Scan[] = [];
  loading = true;
  exporting = false;

  readonly displayedColumns = ['target', 'scanType', 'finishedAt', 'counts', 'actions'];

  ngOnInit(): void {
    this.applyFilters();
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (a, b) =>
            a.fromDate === b.fromDate && a.toDate === b.toDate && a.scanType === b.scanType,
        ),
        skip(1),
      )
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const v = this.filterForm.getRawValue();
    const filters: ScanListFilters = {
      fromDate: v.fromDate || undefined,
      toDate: v.toDate || undefined,
      scanType: v.scanType,
    };
    this.loading = true;
    this.resultsApi.listScansWithFilters(filters).subscribe({
      next: (list) => {
        this.scans = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  scanTypeLabel(t: ScanType): string {
    switch (t) {
      case 'nmap':
        return 'Nmap';
      case 'openvas':
        return 'OpenVAS';
      case 'combined':
        return 'Combinado';
      default:
        return t;
    }
  }

  async exportPdf(): Promise<void> {
    const el = this.pdfArea?.nativeElement;
    if (!el) {
      return;
    }
    this.exporting = true;
    try {
      await this.pdf.exportElement(el, `quiubox-resultados-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      this.exporting = false;
    }
  }
}

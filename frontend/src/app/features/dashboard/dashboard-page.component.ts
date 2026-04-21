import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import type { DashboardStats } from '../../core/models/domain.models';
import { DashboardApiService } from '../../core/services/dashboard-api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly api = inject(DashboardApiService);

  stats: DashboardStats | null = null;
  error: string | null = null;

  constructor() {
    this.api.getStats().subscribe({
      next: (s) => {
        this.stats = s;
      },
      error: () => {
        this.error = 'No se pudieron cargar las métricas';
      },
    });
  }
}

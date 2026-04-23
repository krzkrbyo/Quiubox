import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { Scan } from '../models/domain.models';
import { AuthService } from '../services/auth.service';
import { ScanEventsService } from '../services/scan-events.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly scanEvents = inject(ScanEventsService);

  protected readonly isMobile = signal(false);
  protected readonly menuOpen = signal(true);
  protected readonly activeScans = signal<Scan[]>([]);
  protected readonly navItems = [
    { label: 'Panel', route: '/dashboard', icon: 'dashboard', adminOnly: false },
    { label: 'Escaneos', route: '/scans', icon: 'radar', adminOnly: false },
    { label: 'Resultados', route: '/results', icon: 'fact_check', adminOnly: false },
    { label: 'Usuarios', route: '/admin/users', icon: 'manage_accounts', adminOnly: true },
  ];

  constructor() {
    this.breakpoint
      .observe('(max-width: 899px)')
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile.set(matches);
        if (matches) {
          this.menuOpen.set(false);
        }
      });

    this.scanEvents
      .events()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (event) => {
          if (event.type === 'scan.started') {
            this.activeScans.update((scans) => upsertScan(scans, event.scan));
            return;
          }
          this.activeScans.update((scans) => scans.filter((scan) => scan.id !== event.scanId));
        },
        error: () => undefined,
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenuOnMobile(): void {
    if (this.isMobile()) {
      this.menuOpen.set(false);
    }
  }

  onSidenavOpenedChange(opened: boolean): void {
    if (this.isMobile()) {
      this.menuOpen.set(opened);
    }
  }

  logout(): void {
    this.closeMenuOnMobile();
    this.auth.logout();
  }
}

function upsertScan(scans: Scan[], next: Scan): Scan[] {
  const exists = scans.some((scan) => scan.id === next.id);
  if (exists) {
    return scans.map((scan) => (scan.id === next.id ? next : scan));
  }
  return [next, ...scans];
}

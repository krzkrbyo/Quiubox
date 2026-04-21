import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['qb-snack-success'],
    });
  }

  warn(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 6000,
      panelClass: ['qb-snack-warn'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 7000,
      panelClass: ['qb-snack-error'],
    });
  }

  scanFinished(scanId: string, criticalCount: number): void {
    if (criticalCount > 0) {
      this.warn(`Escaneo ${scanId} finalizado: ${criticalCount} vulnerabilidad(es) crítica(s).`);
    } else {
      this.success(`Escaneo ${scanId} finalizado.`);
    }
  }
}

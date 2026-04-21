import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { Severity } from '../../core/models/domain.models';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="qb-sev" [ngClass]="severity">{{ label }}</span>`,
  styleUrl: './severity-badge.component.scss',
})
export class SeverityBadgeComponent {
  @Input({ required: true }) severity!: Severity;

  get label(): string {
    switch (this.severity) {
      case 'critical':
        return 'CRÍTICA';
      case 'high':
        return 'ALTA';
      case 'medium':
        return 'MEDIA';
      case 'low':
        return 'BAJA';
      default:
        return this.severity;
    }
  }
}

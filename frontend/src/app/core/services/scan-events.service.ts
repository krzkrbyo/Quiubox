import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject, merge, share } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Scan } from '../models/domain.models';

export interface ScanFinishedEvent {
  type: 'scan.finished';
  scanId: string;
  status: Scan['status'];
  criticalCount: number;
  mediumCount: number;
  lowCount: number;
  scan: Scan;
}

export interface ScanStartedEvent {
  type: 'scan.started';
  scanId: string;
  scan: Scan;
}

export type ScanEvent = ScanFinishedEvent | ScanStartedEvent;

@Injectable({ providedIn: 'root' })
export class ScanEventsService {
  private readonly zone = inject(NgZone);
  private readonly localEvents$ = new Subject<ScanEvent>();
  private readonly events$ = new Observable<ScanFinishedEvent>((subscriber) => {
    if (environment.useMock) {
      subscriber.complete();
      return undefined;
    }

    const socket = new WebSocket(this.wsUrl());
    socket.onmessage = (event) => {
      this.zone.run(() => {
        try {
          const payload = JSON.parse(event.data) as ScanFinishedEvent;
          if (payload.type === 'scan.finished') {
            subscriber.next(payload);
          }
        } catch {
          // Ignore non-JSON messages from the socket.
        }
      });
    };
    socket.onerror = () => {
      this.zone.run(() => subscriber.error(new Error('No se pudo conectar al WebSocket de escaneos')));
    };

    return () => socket.close();
  }).pipe(share());

  events(): Observable<ScanEvent> {
    return merge(this.localEvents$, this.events$);
  }

  scanFinished(): Observable<ScanFinishedEvent> {
    return this.events$;
  }

  notifyScanStarted(scan: Scan): void {
    this.localEvents$.next({
      type: 'scan.started',
      scanId: scan.id,
      scan,
    });
  }

  private wsUrl(): string {
    const apiUrl = environment.apiUrl;
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      const url = new URL(apiUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `${url.pathname.replace(/\/$/, '')}/ws/scans`;
      url.search = '';
      return url.toString();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = `${apiUrl.replace(/\/$/, '')}/ws/scans`;
    return `${protocol}//${window.location.host}${path}`;
  }
}

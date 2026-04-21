import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.includes('/auth/login')) {
        return throwError(() => err);
      }
      const msg =
        typeof err.error === 'object' && err.error && 'message' in err.error
          ? String((err.error as { message?: string }).message)
          : typeof err.error === 'string'
            ? err.error
            : err.statusText || 'Error en la solicitud';
      notifications.error(msg);
      return throwError(() => err);
    }),
  );
};

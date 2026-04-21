import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { LoginResponse, User } from '../models/domain.models';

const TOKEN_KEY = 'quiubox_token';
const USER_KEY = 'quiubox_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(this.readStoredUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    if (environment.useMock) {
      return this.mockLogin(username, password);
    }
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/login');
  }

  private mockLogin(username: string, password: string): Observable<LoginResponse> {
    const u = username.trim().toLowerCase();
    const p = password;
    let user: User | null = null;
    if (u === 'admin' && p === 'admin123') {
      user = { id: '1', username: 'admin', email: 'admin@quiubox.local', role: 'admin' };
    } else if (u === 'usuario' && p === 'usuario123') {
      user = { id: '2', username: 'usuario', email: 'usuario@quiubox.local', role: 'user' };
    }
    if (!user) {
      return throwError(() => new Error('Credenciales inválidas'));
    }
    const res: LoginResponse = {
      accessToken: `mock-token-${user.id}`,
      user,
    };
    return of(res).pipe(tap((r) => this.persistSession(r)));
  }

  private persistSession(res: LoginResponse): void {
    sessionStorage.setItem(TOKEN_KEY, res.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSignal.set(res.user);
  }

  private readStoredUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

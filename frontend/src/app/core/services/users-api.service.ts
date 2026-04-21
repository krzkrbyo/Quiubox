import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { Role, User } from '../models/domain.models';
import { MockRepositoryService } from '../mock/mock-repository.service';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  email: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly mockRepo = inject(MockRepositoryService);

  listUsers(): Observable<User[]> {
    if (environment.useMock) {
      return of(this.mockRepo.users.map((u) => ({ ...u })));
    }
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  createUser(req: CreateUserRequest): Observable<User> {
    if (environment.useMock) {
      const user: User = {
        id: this.mockRepo.nextId('user'),
        username: req.username.trim(),
        email: req.email.trim(),
        role: req.role,
      };
      this.mockRepo.users.push(user);
      return of({ ...user }).pipe(delay(150));
    }
    return this.http.post<User>(`${environment.apiUrl}/users`, req);
  }

  updateUser(id: string, req: UpdateUserRequest): Observable<User> {
    if (environment.useMock) {
      const u = this.mockRepo.users.find((x) => x.id === id);
      if (!u) {
        return throwError(() => new Error('Usuario no encontrado'));
      }
      u.email = req.email.trim();
      u.role = req.role;
      return of({ ...u }).pipe(delay(120));
    }
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}`, req);
  }

  deleteUser(id: string): Observable<void> {
    if (environment.useMock) {
      const idx = this.mockRepo.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        this.mockRepo.users.splice(idx, 1);
      }
      return of(undefined).pipe(delay(100));
    }
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }
}

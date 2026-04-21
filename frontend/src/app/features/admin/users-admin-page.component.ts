import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { Role, User } from '../../core/models/domain.models';
import { NotificationService } from '../../core/services/notification.service';
import { UsersApiService } from '../../core/services/users-api.service';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './users-admin-page.component.html',
  styleUrl: './users-admin-page.component.scss',
})
export class UsersAdminPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly notifications = inject(NotificationService);

  users: User[] = [];
  roleDraft: Record<string, Role> = {};

  readonly createForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    role: ['user' as Role, [Validators.required]],
  });

  readonly displayedColumns = ['username', 'email', 'role', 'actions'];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.usersApi.listUsers().subscribe((list) => {
      this.users = list;
      this.roleDraft = {};
      for (const u of list) {
        this.roleDraft[u.id] = u.role;
      }
    });
  }

  create(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.getRawValue();
    this.usersApi
      .createUser({
        username: v.username,
        email: v.email,
        password: v.password,
        role: v.role,
      })
      .subscribe(() => {
        this.notifications.success('Usuario creado');
        this.createForm.reset({ username: '', email: '', password: '', role: 'user' });
        this.reload();
      });
  }

  saveRole(user: User): void {
    const role = this.roleDraft[user.id];
    if (!role || role === user.role) {
      return;
    }
    this.usersApi.updateUser(user.id, { email: user.email, role }).subscribe(() => {
      this.notifications.success('Rol actualizado');
      this.reload();
    });
  }

  remove(user: User): void {
    if (!confirm(`¿Eliminar a ${user.username}?`)) {
      return;
    }
    this.usersApi.deleteUser(user.id).subscribe(() => {
      this.notifications.success('Usuario eliminado');
      this.reload();
    });
  }
}

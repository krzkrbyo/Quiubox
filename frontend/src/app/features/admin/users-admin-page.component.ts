import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { Role, User } from '../../core/models/domain.models';
import { NotificationService } from '../../core/services/notification.service';
import { UsersApiService } from '../../core/services/users-api.service';
import { UserCreateDialogComponent } from './user-create-dialog.component';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatDialogModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly usersApi = inject(UsersApiService);
  private readonly notifications = inject(NotificationService);

  users: User[] = [];
  roleDraft: Record<string, Role> = {};
  editingUserId: string | null = null;

  editForm = {
    nombres: '',
    apellidos: '',
    email: '',
    role: 'user' as Role,
  };

  readonly displayedColumns = ['username', 'nombres', 'apellidos', 'email', 'role', 'actions'];

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
      if (this.editingUserId && !list.some((u) => u.id === this.editingUserId)) {
        this.cancelEdit();
      }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserCreateDialogComponent, {
      autoFocus: false,
      panelClass: 'qb-dialog-panel',
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) {
        return;
      }
      this.notifications.success('Usuario creado');
      this.reload();
    });
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.editForm.nombres = user.nombres;
    this.editForm.apellidos = user.apellidos;
    this.editForm.email = user.email;
    this.editForm.role = user.role;
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editForm = {
      nombres: '',
      apellidos: '',
      email: '',
      role: 'user',
    };
  }

  updateSelectedUser(): void {
    if (!this.editingUserId) {
      return;
    }
    this.usersApi.updateUser(this.editingUserId, this.editForm).subscribe(() => {
      this.notifications.success('Usuario actualizado');
      this.cancelEdit();
      this.reload();
    });
  }

  saveRole(user: User): void {
    const role = this.roleDraft[user.id];
    if (!role || role === user.role) {
      return;
    }
    this.usersApi
      .updateUser(user.id, { nombres: user.nombres, apellidos: user.apellidos, email: user.email, role })
      .subscribe(() => {
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

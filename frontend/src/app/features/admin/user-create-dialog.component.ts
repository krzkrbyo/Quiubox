import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { Role, User } from '../../core/models/domain.models';
import { UsersApiService } from '../../core/services/users-api.service';

export interface UserDialogData {
  mode: 'create' | 'edit' | 'view';
  user?: User;
}

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './user-create-dialog.component.html',
  styleUrl: './user-create-dialog.component.scss',
})
export class UserCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);

  loading = false;
  errorMessage: string | null = null;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    confirmPassword: [''],
    role: ['user' as Role, [Validators.required]],
  });

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: UserDialogData) {
    if (this.isCreateMode()) {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(4)]);
      this.form.controls.confirmPassword.addValidators([Validators.required]);
    }

    if (data.user) {
      this.form.patchValue({
        username: data.user.username,
        nombres: data.user.nombres,
        apellidos: data.user.apellidos,
        email: data.user.email,
        role: data.user.role,
      });
    }

    if (!this.isCreateMode()) {
      this.form.controls.username.disable();
    }

    if (this.isViewMode()) {
      this.form.disable();
    }
  }

  isCreateMode(): boolean {
    return this.data.mode === 'create';
  }

  isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  isViewMode(): boolean {
    return this.data.mode === 'view';
  }

  title(): string {
    if (this.isEditMode()) {
      return 'Editar usuario';
    }
    if (this.isViewMode()) {
      return 'Detalle de usuario';
    }
    return 'Nuevo usuario';
  }

  actionLabel(): string {
    if (this.loading) {
      return this.isEditMode() ? 'Guardando...' : 'Creando...';
    }
    return this.isEditMode() ? 'Guardar cambios' : 'Crear usuario';
  }

  submit(): void {
    if (this.isViewMode()) {
      this.close();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isCreateMode() && this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    if (this.isEditMode()) {
      const user = this.data.user;
      if (!user) {
        this.loading = false;
        this.errorMessage = 'Usuario no encontrado';
        return;
      }

      const raw = this.form.getRawValue();
      this.usersApi
        .updateUser(user.id, {
          nombres: raw.nombres,
          apellidos: raw.apellidos,
          email: raw.email,
          role: raw.role,
        })
        .subscribe({
          next: (updated) => {
            this.loading = false;
            this.dialogRef.close(updated);
          },
          error: (err: unknown) => {
            this.loading = false;
            this.errorMessage = err instanceof Error ? err.message : 'No se pudo actualizar el usuario';
          },
        });
      return;
    }

    const raw = this.form.getRawValue();
    this.usersApi.createUser({
      username: raw.username.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      email: raw.email.trim(),
      password: raw.password,
      role: raw.role,
    }).subscribe({
      next: (user) => {
        this.loading = false;
        this.dialogRef.close(user);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = err instanceof Error ? err.message : 'No se pudo crear el usuario';
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

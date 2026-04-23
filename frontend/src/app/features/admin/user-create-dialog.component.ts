import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { Role } from '../../core/models/domain.models';
import { UsersApiService } from '../../core/services/users-api.service';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
    password: ['', [Validators.required, Validators.minLength(4)]],
    role: ['user' as Role, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.usersApi.createUser(this.form.getRawValue()).subscribe({
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

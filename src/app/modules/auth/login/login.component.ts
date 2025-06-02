import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { ICONS } from '../../../shared/icons';
import { LogoComponent } from "../../../shared/components/logo.component";

@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly ICONS = ICONS;
  protected readonly loading = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]]
  });

  protected get emailErrors(): string {
    const control = this.loginForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El email es requerido';
      if (control.errors['email'] || control.errors['pattern']) return 'Email inválido';
    }
    return '';
  }

  protected get passwordErrors(): string {
    const control = this.loginForm.get('password');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      try {
        this.loading.set(true);
        const { email, password } = this.loginForm.getRawValue();
        await this.authService.loginWithEmail(email, password);
      } finally {
        this.loading.set(false);
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  protected async loginWithGoogle(): Promise<void> {
    try {
      this.loading.set(true);
      await this.authService.loginWithGoogle();
    } finally {
      this.loading.set(false);
    }
  }

  protected async sendResetPasswordEmail(): Promise<void> {
    const email = this.loginForm.get('email')?.value;

    if (!email || !this.loginForm.get('email')?.valid) {
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    try {
      this.loading.set(true);
      await this.authService.resetPassword(email);
    } finally {
      this.loading.set(false);
    }
  }
}
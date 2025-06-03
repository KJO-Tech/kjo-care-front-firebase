import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { ICONS } from '../../../shared/icons';
import { LogoComponent } from "../../../shared/components/logo.component";
import { rxResource } from '@angular/core/rxjs-interop';
import { NEVER } from 'rxjs';
import { LoginEmail } from '../../../core/interfaces/auth-http.interface';

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
  protected readonly loadingGoogle = signal(false);
  protected readonly loadingReset = signal(false);

  protected readonly ICONS = ICONS;

  protected readonly loading = signal(false);
  readonly loginSignal = signal({ email: "", password: "" })
  readonly loginResource = rxResource({
    request: () => this.loginSignal(),
    loader: () => this.isLoginEmpy(this.loginSignal()) ? NEVER : this.authService.loginWithEmail(this.loginSignal())
  })


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

  protected onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginSignal.set({
        email: this.loginForm.value.email ?? '',
        password: this.loginForm.value.password ?? ''
      })
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  isLoginEmpy(login: LoginEmail): boolean {
    return !login.email || !login.password
  }
  protected loginWithGoogle(): void {
    this.loadingGoogle.set(true);
    this.authService.loginWithGoogle().subscribe({
      error: () => this.loadingGoogle.set(false),
      complete: () => this.loadingGoogle.set(false)
    });
  }

  protected sendResetPasswordEmail(): void {
    const email = this.loginForm.get('email')?.value;

    if (!email || !this.loginForm.get('email')?.valid) {
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    this.loadingReset.set(true);
    this.authService.resetPassword(email).subscribe({
      next: () => this.loadingReset.set(false),
      error: () => this.loadingReset.set(false)
    });
  }
}
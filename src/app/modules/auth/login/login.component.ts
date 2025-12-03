import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NEVER } from 'rxjs';
import { LoginEmail } from '../../../core/interfaces/auth-http.interface';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeControllerComponent } from '../../../shared/components/layout/theme-controller/theme-controller.component';
import { LogoComponent } from '../../../shared/components/logo.component';
import { ICONS } from '../../../shared/icons';

@Component({
  selector: 'auth-login',
  templateUrl: './login.component.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    ThemeControllerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly loadingGoogle = signal(false);
  protected readonly loadingReset = signal(false);

  protected readonly ICONS = ICONS;

  private readonly router = inject(Router);
  protected readonly loading = signal(false);
  readonly loginSignal = signal({ email: '', password: '' });
  readonly loginResource = rxResource({
    request: () => this.loginSignal(),
    loader: () =>
      this.isLoginEmpy(this.loginSignal())
        ? NEVER
        : this.authService.loginWithEmail(this.loginSignal()),
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const userData = this.authService.userData();

      if (user && userData) {
        this.handleRedirect(userData);
      }
    });
  }

  private handleRedirect(userData: any) {
    // Check if createdAt is today
    let createdAt = userData.createdAt;
    if (createdAt && typeof createdAt.toDate === 'function') {
      createdAt = createdAt.toDate();
    } else if (!(createdAt instanceof Date)) {
      createdAt = new Date(createdAt);
    }

    const today = new Date();
    const isNewUser =
      createdAt.getDate() === today.getDate() &&
      createdAt.getMonth() === today.getMonth() &&
      createdAt.getFullYear() === today.getFullYear();

    if (isNewUser) {
      this.router.navigate(['/app/activity-subscription']);
    } else {
      this.router.navigate(['/app']);
    }
  }

  protected readonly loginForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected get emailErrors(): string {
    const control = this.loginForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El email es requerido';
      if (control.errors['email'] || control.errors['pattern'])
        return 'Email inválido';
    }
    return '';
  }

  protected get passwordErrors(): string {
    const control = this.loginForm.get('password');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength'])
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  protected onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginSignal.set({
        email: this.loginForm.value.email ?? '',
        password: this.loginForm.value.password ?? '',
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  isLoginEmpy(login: LoginEmail): boolean {
    return !login.email || !login.password;
  }
  protected loginWithGoogle(): void {
    this.loadingGoogle.set(true);
    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        if (response.success) {
          // The effect will handle redirection once userData is available
        }
      },
      error: () => this.loadingGoogle.set(false),
      complete: () => this.loadingGoogle.set(false),
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
      error: () => this.loadingReset.set(false),
    });
  }
}

import { CommonModule } from '@angular/common';
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
import { RegisterForm } from '../../../core/interfaces/auth-http.interface';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeControllerComponent } from '../../../shared/components/layout/theme-controller/theme-controller.component';
import { LogoComponent } from '../../../shared/components/logo.component';

@Component({
  selector: 'auth-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    ThemeControllerComponent,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  private router = inject(Router);

  protected readonly loading = signal(false);
  readonly registerSignal = signal({
    displayName: '',
    email: '',
    password: '',
  });
  readonly registerResource = rxResource({
    request: () => this.registerSignal(),
    loader: () =>
      this.isRegisterEmpy(this.registerSignal())
        ? NEVER
        : this.authService.register(this.registerSignal()),
  });

  constructor() {
    effect(() => {
      if (this.registerResource.value()?.success) {
        this.router.navigate(['/app']);
      }
    });
  }

  registerForm = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator.bind(this),
    },
  );

  protected get displayNameErrors(): string {
    const control = this.registerForm.get('displayName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es requerido';
      if (control.errors['minlength'])
        return 'El nombre debe tener al menos 3 caracteres';
    }
    return '';
  }

  protected get emailErrors(): string {
    const control = this.registerForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El email es requerido';
      if (control.errors['email'] || control.errors['pattern'])
        return 'Email inválido';
    }
    return '';
  }

  protected get passwordErrors(): string {
    const control = this.registerForm.get('password');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength'])
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  protected get confirmPasswordErrors(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debe confirmar la contraseña';
      if (control.errors['passwordMismatch'])
        return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private passwordMatchValidator(group: any) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  isRegisterEmpy(register: RegisterForm): boolean {
    return !register.displayName || !register.email || !register.password;
  }

  protected onSubmit(): void {
    if (this.registerForm.valid) {
      this.registerSignal.set({
        displayName: this.registerForm.value.displayName ?? '',
        email: this.registerForm.value.email ?? '',
        password: this.registerForm.value.password ?? '',
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}

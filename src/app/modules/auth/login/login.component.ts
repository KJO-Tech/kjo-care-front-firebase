import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { ICONS } from '../../../shared/icons';
import { LogoComponent } from "../../../shared/components/logo.component";

@Component({
  selector: 'auth-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  protected readonly ICONS = ICONS;
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)

  loading = signal(false)
  error = signal<string | null>(null)

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })
  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        this.loading.set(true);
        const { email, password } = this.loginForm.getRawValue();
        await this.authService.loginWithEmail(email, password);
      } catch (error) {
        this.error.set('Credenciales inválidas');
      } finally {
        this.loading.set(false);
      }
    }
  }

  async loginWithGoogle() {
    try {
      this.loading.set(true);
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.error.set('Error al iniciar sesión con Google');
    } finally {
      this.loading.set(false);
    }
  }
}

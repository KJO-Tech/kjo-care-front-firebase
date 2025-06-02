import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogoComponent } from "../../../shared/components/logo.component";

@Component({
  selector: 'auth-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });
  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        this.loading.set(true);
        const { email, password, displayName } = this.registerForm.getRawValue();
        await this.authService.register(email, password, displayName);
      } catch (error) {
      } finally {
        this.loading.set(false);
      }
    }
  }
}

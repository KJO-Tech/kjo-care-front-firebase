import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserRequest, UserResponse } from '../../../core/interfaces/user-http.interface';
import { FormUtils } from '../../../shared/utils/form-utils';

@Component({
  selector: 'user-modal',
  templateUrl: './user-modal.component.html',
  imports: [ReactiveFormsModule]
})
export class UserModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly user = input<UserResponse | null>(null);
  readonly type = input<'create' | 'edit'>('create');
  readonly reload = output<void>();

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);

  readonly title = computed(() =>
    this.type() === 'create' ? 'Crear nuevo usuario' : `Editar ${this.user()?.displayName || 'usuario'}`
  );

  readonly submitButtonText = computed(() =>
    this.type() === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'
  );

  readonly modalId = computed(() =>
    this.type() === 'create' ? 'modal_user_create' : 'modal_user_edit'
  );

  readonly userForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    password: [''],
    roles: [['user'], [Validators.required]]
  });

  readonly formUtils = FormUtils;

  constructor() {
    effect(() => {
      const passwordControl = this.userForm.get('password');
      if (this.type() === 'create') {
        passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
        passwordControl?.enable();
      } else {
        passwordControl?.clearValidators();
        passwordControl?.disable();
      }
      passwordControl?.updateValueAndValidity();
    });

    effect(() => {
      const userToEdit = this.user();
      if (userToEdit && this.type() === 'edit') {
        this.userForm.patchValue({
          email: userToEdit.email,
          displayName: userToEdit.displayName,
          password: '',
          roles: userToEdit.roles
        });
      }
    });

    effect(() => {
      const emailControl = this.userForm.get('email');
      const usernameControl = this.userForm.get('displayName');

      if (emailControl?.value && this.type() === 'create' && !usernameControl?.dirty) {
        const emailPrefix = emailControl.value.split('@')[0];
        usernameControl?.setValue(emailPrefix);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSubmitting()) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.userForm.getRawValue();

    const operation$ = this.type() === 'create'
      ? this.createUser(formValue)
      : this.updateUser(formValue);

    operation$.subscribe({
      next: () => {
        this.reload.emit();
        this.resetForm();
        this.closeModal();
      },
      error: () => this.isSubmitting.set(false),
      complete: () => this.isSubmitting.set(false)
    });
  }

  private createUser(formValue: any) {
    const request: Omit<UserRequest, 'id'> = {
      displayName: formValue.displayName,
      email: formValue.email,
      password: formValue.password,
      roles: Array.isArray(formValue.roles) ? formValue.roles : [formValue.roles]
    };

    return this.userService.create(request);
  }

  private updateUser(formValue: any) {
    const currentUser = this.user();
    if (!currentUser?.id) throw new Error('User ID required');

    const request: Partial<UserRequest> = {
      displayName: formValue.displayName,
      email: formValue.email,
      roles: Array.isArray(formValue.roles) ? formValue.roles : [formValue.roles]
    };

    if (formValue.password?.trim()) {
      request.password = formValue.password;
    }

    return this.userService.update(currentUser.id, request);
  }

  toggleShowPassword(): void {
    this.showPassword.update(current => !current);
  }

  private resetForm(): void {
    this.userForm.reset({ roles: ['user'] });
    this.showPassword.set(false);
    this.isSubmitting.set(false);
  }

  private closeModal(): void {
    const modal = document.getElementById(this.modalId()) as HTMLDialogElement;
    modal?.close();
  }
}

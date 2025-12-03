import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  imports: [ReactiveFormsModule],
})
export default class EditProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cloudinaryService = inject(CloudinaryService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  user = this.authService.userData;
  isLoading = signal(false);
  isUploading = signal(false);

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    profileImage: [null as string | null],
  });

  selectedFile: File | null = null;

  constructor() {
    const userData = this.user();
    if (userData) {
      this.profileForm.patchValue({
        fullName: userData.fullName,
        profileImage: userData.profileImage || null,
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.addToast({
        message: 'La imagen no debe superar los 2MB',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.addToast({
        message: 'El archivo debe ser una imagen',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    this.selectedFile = file;

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.profileForm.patchValue({
        profileImage: e.target?.result as string,
      });
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.profileForm.patchValue({
      profileImage: null,
    });
  }

  save(): void {
    if (this.profileForm.invalid) return;

    const userData = this.user();
    if (!userData) return;

    this.isLoading.set(true);
    const { fullName } = this.profileForm.value;

    if (this.selectedFile) {
      this.cloudinaryService
        .uploadFile({
          file: this.selectedFile,
          resourceType: 'image',
          folder: 'users/avatars',
        })
        .pipe(
          switchMap((response) => {
            return this.authService.updateProfile(userData.uid, {
              fullName: fullName!,
              profileImage: response.secure_url,
            });
          }),
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/app/profile']);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
    } else {
      this.authService
        .updateProfile(userData.uid, {
          fullName: fullName!,
          profileImage: this.profileForm.value.profileImage || (null as any),
        })
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/app/profile']);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/app/profile']);
  }
}

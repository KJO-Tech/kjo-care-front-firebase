import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER, of, switchMap, tap } from 'rxjs';
import { Blog, BlogStatus, MediaType } from '../../../../core/models/blog';
import { BlogService } from '../../../../core/services/blog.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'community-form-blog',
  templateUrl: './community-form-blog.component.html',
  imports: [ReactiveFormsModule],
})
export default class CommunityFormBlogComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private blogService = inject(BlogService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private cloudinaryService = inject(CloudinaryService);

  categories = rxResource({
    loader: () => this.categoryService.findAll(),
  });

  blog = rxResource({
    request: () => this.blogId(),
    loader: ({ request }) => {
      if (request !== '') {
        return this.blogService.getById(request).pipe(
          tap((blog) => {
            if (blog) {
              this.blogForm.patchValue({
                title: blog.title,
                content: blog.content,
                categoryId: blog.categoryId || '',
              });
              // Set existing media for preview
              if (blog.mediaUrl) {
                this.existingMediaUrl.set(blog.mediaUrl);
                this.mediaType.set(blog.mediaType || null);
              }
            }
          }),
        );
      } else return NEVER;
    },
  });

  title = signal('Añadir nuevo post');
  nameButton = signal('Guardar');
  blogId = signal<string>('');
  isLoading = signal(false);
  isUploading = this.cloudinaryService.isUploading;

  // Media upload signals
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  existingMediaUrl = signal<string | null>(null);
  mediaType = signal<MediaType | null>(null);

  blogForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(5)]],
    categoryId: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      this.route.queryParamMap.subscribe((params) => {
        let id = params.get('id') ?? '';
        if (id !== '') {
          this.blogId.set(id);
          this.title.set('Editar post');
          this.nameButton.set('Actualizar');
        }
      });
    });
  }

  goBack() {
    this.router.navigate(['/app/community']);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const maxSize = file.type.startsWith('video/')
      ? 50 * 1024 * 1024
      : 10 * 1024 * 1024; // 50MB for video, 10MB for image

    // Validate file size
    if (file.size > maxSize) {
      this.toastService.addToast({
        message: `El archivo es muy grande. Máximo ${file.type.startsWith('video/') ? '50MB' : '10MB'}`,
        type: 'error',
        duration: 4000,
      });
      return;
    }

    // Validate file type
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const validVideoTypes = ['video/mp4', 'video/webm'];

    if (
      !validImageTypes.includes(file.type) &&
      !validVideoTypes.includes(file.type)
    ) {
      this.toastService.addToast({
        message:
          'Tipo de archivo no válido. Solo imágenes (JPG, PNG, GIF, WEBP) o videos (MP4, WEBM)',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    // Set file and media type
    this.selectedFile.set(file);
    this.mediaType.set(
      file.type.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
    );

    // Generate preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
      this.existingMediaUrl.set(null); // Clear existing media when new file is selected
    };
    reader.readAsDataURL(file);
  }

  clearMedia() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.existingMediaUrl.set(null);
    this.mediaType.set(null);

    // Reset file input
    const fileInput = document.getElementById('mediaInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onSubmit() {
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      this.toastService.addToast({
        message: 'Por favor completa todos los campos requeridos',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    this.isLoading.set(true);

    const file = this.selectedFile();
    let upload$ = of<{ url: string | null; type: MediaType | null }>({
      url: null,
      type: null,
    });

    if (file) {
      // Upload new file to Cloudinary
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      upload$ = this.cloudinaryService.uploadFile({ file, resourceType }).pipe(
        switchMap((res) =>
          of({
            url: res.secure_url,
            type: file.type.startsWith('video/')
              ? MediaType.VIDEO
              : MediaType.IMAGE,
          }),
        ),
      );
    } else if (this.existingMediaUrl()) {
      // Keep existing media if no new file
      upload$ = of({
        url: this.existingMediaUrl(),
        type: this.mediaType(),
      });
    }

    upload$
      .pipe(
        switchMap((media) => {
          const blogData: Partial<Blog> = {
            title: this.blogForm.value.title,
            content: this.blogForm.value.content,
            categoryId: this.blogForm.value.categoryId,
            mediaUrl: media.url,
            mediaType: media.type,
            status: BlogStatus.PENDING, // Posts go to review
          };

          if (this.blogId() !== '' && !this.blog.error()) {
            return this.blogService.update(this.blogId(), blogData);
          } else {
            return this.blogService.create(blogData);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: this.blogId()
              ? 'Post actualizado con éxito'
              : 'Post creado con éxito',
            type: 'success',
            duration: 4000,
          });
          this.router.navigate(['/app/community/success']);
        },
        error: (error) => {
          this.toastService.addToast({
            message: 'Error guardando el post',
            type: 'error',
            duration: 4000,
          });
          console.error('Error saving blog:', error);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  getFieldError(field: string): string {
    const control = this.blogForm.get(field);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  isValidField(field: string): boolean {
    const control = this.blogForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}

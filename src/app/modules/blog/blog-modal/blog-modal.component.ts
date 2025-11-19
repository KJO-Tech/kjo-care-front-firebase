import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Blog,
  BlogStatus,
  Category,
  MediaType,
} from '../../../core/models/blog';

import { of, switchMap } from 'rxjs';
import { BlogService } from '../../../core/services/blog.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormUtils } from '../../../shared/utils/form-utils';

@Component({
  selector: 'blog-modal',
  templateUrl: './blog-modal.component.html',
  imports: [ReactiveFormsModule, NgClass],
})
export class BlogModalComponent implements OnInit {
  protected readonly Status = BlogStatus;

  private fb = inject(FormBuilder);
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private cloudinaryService = inject(CloudinaryService);

  reload = output();

  formUtils = FormUtils;

  blog = input<Blog | null>();
  categories = input.required<Category[]>();
  type = input<'create' | 'edit'>('create');

  title = signal('Add new blog');
  nameButton = signal('Save');
  nameModal = computed(() =>
    this.type() === 'create' ? 'modal_blog_create' : 'modal_blog_edit',
  );

  message = signal<string | null>(null);
  isUploading = this.cloudinaryService.isUploading;

  blogForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(5)]],
    image: [null],
    video: [null],
    categoryId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.type() == 'edit') {
      this.title.set('Edit blog');
      this.nameButton.set('Update');
    }
  }

  constructor() {
    effect(() => {
      if (this.blog()) {
        this.blogForm.patchValue({
          title: this.blog()?.title,
          content: this.blog()?.content,
          categoryId: this.blog()?.categoryId,
        });
      }
    });
  }

  onSubmit() {
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      console.log('Form invalid');
      return;
    }

    const imageFile = this.blogForm.get('image')?.value;
    const videoFile = this.blogForm.get('video')?.value;

    let upload$ = of<{ url: string | null; type: MediaType | null }>({
      url: null,
      type: null,
    });

    if (imageFile instanceof File) {
      upload$ = this.cloudinaryService
        .uploadFile({ file: imageFile, resourceType: 'image' })
        .pipe(
          switchMap((res) =>
            of({ url: res.secure_url, type: MediaType.IMAGE }),
          ),
        );
    } else if (videoFile instanceof File) {
      upload$ = this.cloudinaryService
        .uploadFile({ file: videoFile, resourceType: 'video' })
        .pipe(
          switchMap((res) =>
            of({ url: res.secure_url, type: MediaType.VIDEO }),
          ),
        );
    } else if (this.blog()?.mediaUrl) {
      // Keep existing media if no new file
      upload$ = of({
        url: this.blog()!.mediaUrl!,
        type: this.blog()!.mediaType!,
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
          };

          if (this.blog()) {
            return this.blogService.update(this.blog()!.id, blogData);
          } else {
            return this.blogService.create(blogData);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: this.blog()
              ? 'Blog updated successfully'
              : 'Blog created successfully',
            type: 'success',
            duration: 4000,
          });
          this.reload.emit();
          if (!this.blog()) {
            this.blogForm.reset();
            this.blogForm.clearValidators();
          }
        },
        error: (error) => {
          this.toastService.addToast({
            message: 'Error saving blog',
            type: 'error',
            duration: 4000,
          });
        },
      });
  }

  onFileChange(event: Event, field: 'image' | 'video') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.blogForm.patchValue({
        [field]: file,
      });
      this.blogForm.get(field)?.updateValueAndValidity();
    }
  }
}

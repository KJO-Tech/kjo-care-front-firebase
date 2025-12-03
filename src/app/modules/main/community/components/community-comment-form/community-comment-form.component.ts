import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { CommentService } from '../../../../../core/services/comment.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'community-comment-form',
  templateUrl: './community-comment-form.component.html',
  imports: [ReactiveFormsModule],
})
export class CommunityCommentFormComponent {
  private fb = inject(FormBuilder);
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  blogId = input.required<string>();
  parentCommentId = input<string | null>(null);

  reload = output();

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
  });

  onSubmit() {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const content = this.commentForm.value.content!;
    const parentId = this.parentCommentId() || undefined;

    this.commentService.create(this.blogId(), content, parentId).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Comentario creado con éxito',
          type: 'success',
          duration: 4000,
        });

        this.reload.emit();
        this.commentForm.reset();
        this.commentForm.markAsUntouched();
      },
      error: (error) => {
        this.toastService.addToast({
          message: 'Error al crear el comentario',
          type: 'error',
          duration: 4000,
        });
        console.error('Error creating comment:', error);
      },
    });
  }

  getUserLetters(): string {
    const user = this.authService.userData();
    if (!user || !user.fullName) return '??';

    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0] + (names[0][1] || '?');
  }
}

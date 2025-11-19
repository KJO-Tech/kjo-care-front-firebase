import { Component, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { CommentService } from '../../../core/services/comment.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormUtils } from '../../../shared/utils/form-utils';

@Component({
  selector: 'blog-comment-modal',
  templateUrl: './blog-comment-modal.component.html',
  imports: [ReactiveFormsModule],
})
export class BlogCommentModalComponent {
  private fb = inject(FormBuilder);
  private commentService = inject(CommentService);
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);

  reload = output();

  title = signal('Add new comment');
  nameButton = signal('Save');

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    effect(() => {
      this.title.set('Add new comment');
      this.nameButton.set('Save');

      const selected = this.commentService.selectedComment;

      if (selected) {
        if (selected.id && selected.id !== '') {
          // Edit existing comment
          this.title.set('Edit comment');
          this.nameButton.set('Update');
          this.commentForm.patchValue({
            content: selected.content,
          });
        } else if (selected.parentCommentId) {
          // Reply
          this.title.set('Reply to comment');
          this.nameButton.set('Reply');
          this.commentForm.patchValue({
            content: '',
          });
        } else {
          // New comment (id is empty or null, parentId is null)
          this.commentForm.patchValue({
            content: '',
          });
        }
      }
    });
  }

  onSubmit() {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      console.log('Form invalid');
      return;
    }

    const content = this.commentForm.value.content!;
    const selected = this.commentService.selectedComment;
    const blogId = this.blogService.selectedBlog?.id;

    if (!blogId) {
      this.toastService.addToast({
        message: 'Error: No blog selected',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (selected && selected.id && selected.id !== '') {
      // Update
      return this.commentService
        .update(blogId, selected.id, content)
        .pipe()
        .subscribe({
          next: () => {
            this.toastService.addToast({
              message: 'Comment updated successfully',
              type: 'success',
              duration: 4000,
            });

            this.reloadComments();
            this.commentForm.reset();
            this.commentForm.clearValidators();
          },
          error: (error) => {
            this.toastService.addToast({
              message: error.message || 'Error updating comment',
              type: 'error',
              duration: 4000,
            });
          },
        });
    } else {
      // Create (New or Reply)
      const parentId = selected?.parentCommentId || undefined;
      return this.commentService
        .create(blogId, content, parentId)
        .pipe()
        .subscribe({
          next: () => {
            this.toastService.addToast({
              message: 'Comment created successfully',
              type: 'success',
              duration: 4000,
            });

            this.reloadComments();
            this.commentForm.reset();
            this.commentForm.clearValidators();
          },
          error: (error) => {
            this.toastService.addToast({
              message: error.message || 'Error creating comment',
              type: 'error',
              duration: 4000,
            });
          },
        });
    }
  }

  reloadComments() {
    this.reload.emit();
  }

  protected readonly formUtils = FormUtils;
}

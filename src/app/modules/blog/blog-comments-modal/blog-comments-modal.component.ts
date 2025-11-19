import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { BlogService } from '../../../core/services/blog.service';
import { CommentService } from '../../../core/services/comment.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { BlogCommentModalComponent } from '../blog-comment-modal/blog-comment-modal.component';
import { BlogCommentComponent } from './blog-comment/blog-comment.component';

@Component({
  selector: 'blog-comments-modal',
  templateUrl: './blog-comments-modal.component.html',
  imports: [
    BlogCommentComponent,
    DialogComponent,
    ModalOpenButtonComponent,
    BlogCommentModalComponent,
  ],
})
export class BlogCommentsModalComponent {
  blogService = inject(BlogService);
  commentService = inject(CommentService);
  toastService = inject(ToastService);

  readonly comments = rxResource({
    request: () => this.blogService.selectedBlog?.id,
    loader: ({ request: blogId }) => {
      if (!blogId) return of([]);
      return this.commentService.getComments(blogId);
    },
  });

  deleteComment() {
    const blogId = this.blogService.selectedBlog?.id;
    const commentId = this.commentService.selectedComment?.id;

    if (!blogId || !commentId) return;

    this.commentService.delete(blogId, commentId).subscribe({
      next: () => {
        this.comments.reload();
        this.toastService.addToast({
          message: 'Comment deleted successfully',
          type: 'success',
          duration: 4000,
        });
      },
      error: (error) => {
        this.toastService.addToast({
          message: 'Error deleting comment',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  reload() {
    this.comments.reload();
  }
}

import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
} from '@angular/core';
import { Comment } from '../../../../core/models/blog';
import { BlogService } from '../../../../core/services/blog.service';
import { CommentService } from '../../../../core/services/comment.service';
import { ModalOpenButtonComponent } from '../../../../shared/components/modal-open-button/modal-open-button.component';
import { CommentRequest } from '../../../../core/interfaces/blog-http.interface';

@Component({
  selector: 'blog-comment',
  templateUrl: './blog-comment.component.html',
  imports: [ModalOpenButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BlogCommentComponent {
  readonly comment = input.required<Comment>();
  readonly commentParentId = input.required<string | null>();

  readonly blogService = inject(BlogService);
  readonly commentService = inject(CommentService);

  readonly userLetters = computed<string>(() => {
    const fullName = this.comment().author?.fullName || '?';
    const names = fullName.trim().split(' ');
    const firstInitial = names[0]?.[0] ?? '?';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  });

  selectComment(type: 'edit' | 'reply' | 'create' | 'delete'): CommentRequest {
    const currentComment = this.comment() as CommentRequest;
    const blogId = this.blogService.selectedBlog?.id || '';

    switch (type) {
      case 'edit':
        return {
          ...currentComment,
          // Ensure we have necessary fields if they are missing in partial updates (though here we have full comment)
        };
      case 'reply':
        return {
          id: '',
          blogId: blogId,
          content: '',
          parentCommentId: currentComment.id,
        };
      case 'create':
        return {
          id: '',
          blogId: blogId,
          content: currentComment.content,
          parentCommentId: null,
        };
      case 'delete':
        return currentComment;
    }
  }
}

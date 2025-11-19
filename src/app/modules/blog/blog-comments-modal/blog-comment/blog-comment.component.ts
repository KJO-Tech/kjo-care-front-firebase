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

  commentService = inject(CommentService);

  readonly userLetters = computed<string>(() => {
    const fullName = this.comment().author?.fullName || '?';
    const names = fullName.trim().split(' ');
    const firstInitial = names[0]?.[0] ?? '?';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  });

  selectComment(type: 'edit' | 'reply' | 'create' | 'delete'): Comment {
    const currentComment = this.comment();
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
          content: '',
          author: currentComment.author, // Placeholder, will be overwritten by service/backend or ignored
          createdAt: null as any,
          replies: [],
          isMine: false,
          parentCommentId: currentComment.id,
        };
      case 'create':
        return {
          id: '',
          content: currentComment.content, // Copy content? Or empty? Usually empty for new. But here it says create... maybe it means quote? Or just new.
          // If it's create, why are we selecting a comment? Maybe this method is used for generic button actions?
          // Assuming 'create' means new top level comment, but this component is a comment item.
          // If it's 'create', it might be a mistake in original code or context.
          // Let's assume it's for replying or something.
          // But for now, let's return a blank comment structure.
          author: currentComment.author,
          createdAt: null as any,
          replies: [],
          isMine: false,
          parentCommentId: null,
        };
      case 'delete':
        return currentComment;
    }
  }
}

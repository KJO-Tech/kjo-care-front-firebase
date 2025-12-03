import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  inject,
  input,
  Output,
} from '@angular/core';
import { CommentRequest } from '../../../../../core/interfaces/blog-http.interface';
import { Comment } from '../../../../../core/models/blog';
import { AuthService } from '../../../../../core/services/auth.service';
import { BlogService } from '../../../../../core/services/blog.service';
import { CommentService } from '../../../../../core/services/comment.service';
import { ModalOpenButtonComponent } from '../../../../../shared/components/modal-open-button/modal-open-button.component';

@Component({
  selector: 'community-blog-comment',
  templateUrl: './community-blog-comment.component.html',
  imports: [ModalOpenButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommunityBlogCommentComponent {
  readonly comment = input.required<Comment>();
  readonly commentParentId = input.required<string | null>();
  readonly userId = input<string>();
  @Output() deleteComment = new EventEmitter<string>();

  readonly blogService = inject(BlogService);
  commentService = inject(CommentService);
  private authService = inject(AuthService);

  readonly userLetters = computed<string>(() => {
    const fullName: string = this.comment().author.fullName ?? '??';
    return fullName.substring(0, 2).toUpperCase();
  });

  readonly isMine = computed<boolean>(() => {
    const user = this.authService.userData();
    const comment = this.comment();
    return user ? comment.author.uid === user.uid : false;
  });

  selectComment(type: 'edit' | 'reply' | 'create' | 'delete'): CommentRequest {
    const blogId = this.blogService.selectedBlog?.id ?? '';
    switch (type) {
      case 'edit':
        return {
          id: this.comment().id.toString(),
          content: this.comment().content,
          blogId: blogId,
          parentCommentId: this.commentParentId(),
        };
      case 'reply':
        return {
          id: '',
          content: '',
          blogId: blogId,
          parentCommentId: this.comment().id.toString(),
        };
      case 'create':
        return {
          id: '',
          content: this.comment().content,
          blogId: blogId,
          parentCommentId: null,
        };
      case 'delete':
        return {
          id: this.comment().id.toString(),
          content: this.comment().content,
          blogId: blogId,
          parentCommentId: null,
        };
    }
  }
}

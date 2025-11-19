import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Blog } from '../../../core/models/blog';
import { BlogService } from '../../../core/services/blog.service';
import { CommentService } from '../../../core/services/comment.service';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';

@Component({
  selector: 'blog-detail',
  templateUrl: './blog-detail.component.html',
  imports: [ModalOpenButtonComponent, DatePipe],
})
export class BlogDetailComponent {
  blogService = inject(BlogService);
  commentService = inject(CommentService);

  blog = input.required<Blog>();

  type = input<'text' | 'icon'>('text');
}

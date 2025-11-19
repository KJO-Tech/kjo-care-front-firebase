import { Component, inject, input } from '@angular/core';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { BlogService } from '../../../core/services/blog.service';
import { Blog } from '../../../core/models/blog';

@Component({
  selector: 'blog-detail',
  templateUrl: './blog-detail.component.html',
  imports: [
    ModalOpenButtonComponent
  ]
})
export class BlogDetailComponent {
  blogService = inject(BlogService);

  blog = input.required<Blog>();

  type = input<'text' | 'icon'>('text');


}

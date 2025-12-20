import { Component, inject, input } from '@angular/core';

import { Blog, BlogStatus } from '../../../../../core/models/blog';
import { BlogService } from '../../../../../core/services/blog.service';
import { ModalOpenButtonComponent } from '../../../../../shared/components/modal-open-button/modal-open-button.component';

@Component({
  selector: 'blog-card-options-button',
  templateUrl: './options-button.component.html',
  imports: [ModalOpenButtonComponent],
})
export class OptionsButtonComponent {
  blogService = inject(BlogService);
  protected readonly Status = BlogStatus;

  blog = input.required<Blog>();
}

import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Blog, BlogStatus } from '../../../../core/models/blog';
import { BlogService } from '../../../../core/services/blog.service';
import { ModalOpenButtonComponent } from '../../../../shared/components/modal-open-button/modal-open-button.component';
import { OptionsButtonComponent } from './options-button/options-button.component';

@Component({
  selector: 'blog-card',
  templateUrl: './blog-card.component.html',
  imports: [OptionsButtonComponent, ModalOpenButtonComponent, DatePipe],
})
export class BlogCardComponent {
  blogService = inject(BlogService);

  blog = input.required<Blog>();

  protected readonly Status = BlogStatus;
}

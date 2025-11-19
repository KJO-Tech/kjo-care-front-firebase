import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Blog, BlogStatus } from '../../../core/models/blog';
import { BlogService } from '../../../core/services/blog.service';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';

@Component({
  selector: 'blog-table',
  templateUrl: './blog-table.component.html',
  imports: [ModalOpenButtonComponent, DatePipe],
})
export class BlogTableComponent {
  blogService = inject(BlogService);

  protected readonly Status = BlogStatus;

  blogs = input.required<Blog[]>();
  categories = input.required<any[]>();

  getCategoryName(id: string): string {
    const category = this.categories().find((c) => c.id === id);
    return category?.nameTranslations?.en || category?.name || id;
  }
}

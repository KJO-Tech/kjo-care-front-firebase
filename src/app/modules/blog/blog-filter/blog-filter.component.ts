import { Component, effect, input, output, signal } from '@angular/core';
import { BlogStatus, Category, FilterDTO } from '../../../core/models/blog';

@Component({
  selector: 'blog-filter',
  imports: [],
  templateUrl: './blog-filter.component.html',
})
export class BlogFilterComponent {
  protected readonly Status = BlogStatus;

  categories = input.required<Category[]>();

  onFilterChange = output<FilterDTO>();

  search = signal<string>('');
  category = signal<string>('');
  status = signal<string>('');

  filterBlogs() {
    this.onFilterChange.emit({
      search: this.search(),
      category: this.category(),
      status: this.status() as BlogStatus,
    });
  }

  // Do filterBlogs() when search or category or status changes
  onValueChanges = effect(() => {
    this.filterBlogs();
  });
}

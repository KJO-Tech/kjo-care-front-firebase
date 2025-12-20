import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Blog, BlogStatus, Category, FilterDTO } from '../../core/models/blog';
import { BlogService } from '../../core/services/blog.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ModalOpenButtonComponent } from '../../shared/components/modal-open-button/modal-open-button.component';
import { BlogCommentsModalComponent } from './blog-comments-modal/blog-comments-modal.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { BlogFilterComponent } from './blog-filter/blog-filter.component';
import { BlogGridComponent } from './blog-grid/blog-grid.component';
import { BlogModalComponent } from './blog-modal/blog-modal.component';
import { BlogTableComponent } from './blog-table/blog-table.component';

@Component({
  selector: 'app-blog',
  imports: [
    BlogModalComponent,
    BlogGridComponent,
    BlogTableComponent,
    BlogFilterComponent,
    BlogDetailComponent,
    DialogComponent,
    ModalOpenButtonComponent,
    BlogCommentsModalComponent,
  ],
  templateUrl: './blog-page.component.html',
})
export default class BlogPageComponent {
  blogService = inject(BlogService);
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);

  blogs = rxResource({
    loader: () => this.blogService.findAll(),
  });
  _categories = rxResource({
    loader: () => this.categoryService.findAll(),
  });

  categories = computed<Category[]>(() => {
    return this._categories.value() ?? [];
  });

  filteredBlogs = computed<Blog[]>(() => {
    let temporal = this.blogs.value() ?? [];
    const filter = this.filter();

    if (filter.search.length > 0) {
      temporal = temporal.filter((blog) =>
        blog.title.toLowerCase().includes(filter.search.toLowerCase()),
      );
    }

    if (filter.category.length > 0) {
      temporal = temporal.filter((blog) => blog.categoryId === filter.category);
    }

    if (filter.status.length > 0) {
      temporal = temporal.filter((blog) => blog.status === filter.status);
    }

    return temporal;
  });

  private filter = signal<FilterDTO>({
    search: '',
    category: '',
    status: BlogStatus.PUBLISHED,
  });

  setFilter(filter: FilterDTO) {
    this.filter.set(filter);
  }

  deleteBlog() {
    const selectedBlog = this.blogService.selectedBlog;
    if (!selectedBlog) return;

    this.blogService.reject(selectedBlog).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Blog deleted successfully',
          type: 'success',
          duration: 4000,
        });

        this.reload();
      },
      error: (error) => {
        this.toastService.addToast({
          message: 'Error deleting blog',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  approveBlog() {
    const selectedBlog = this.blogService.selectedBlog;
    if (!selectedBlog) return;

    this.blogService.approve(selectedBlog).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Blog approved successfully',
          type: 'success',
          duration: 4000,
        });

        this.reload();
      },
      error: (error) => {
        this.toastService.addToast({
          message: 'Error approving blog',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  reload() {
    this.blogs.reload();
  }

  constructor() {
    effect(() => {
      switch (this.blogs.status()) {
        case 1:
          this.toastService.addToast({
            message: 'No se pudieron cargar los blogs',
            type: 'error',
            duration: 3000,
          });
          break;
        case 5:
          this.toastService.addToast({
            message: 'Se usaran blogs de ejemplo',
            type: 'info',
            duration: 3000,
          });
          break;
      }
    });
  }
}

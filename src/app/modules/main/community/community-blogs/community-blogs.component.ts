import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Blog, BlogStatus } from '../../../../core/models/blog';
import { Category } from '../../../../core/models/blog';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogService } from '../../../../core/services/blog.service';
import { CategoryService } from '../../../../core/services/category.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
  selector: 'community-blogs',
  templateUrl: './community-blogs.component.html',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class CommunityBlogsComponent {
  private router = inject(Router);
  private blogService = inject(BlogService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  blogs = rxResource({
    loader: () => this.blogService.findAll(),
  });

  categories = rxResource({
    loader: () => this.categoryService.findAll(),
  });

  search = signal<string>('');
  category = signal<string>('');
  type = signal<'default' | 'recent' | 'popular' | 'my-blogs'>('default');

  filteredBlogs = computed<Blog[]>(() => {
    let temporal = this.blogs.value() ?? [];

    // Filter only published blogs for non-admin users
    const user = this.authService.userData();
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
      temporal = temporal.filter(
        (blog) => blog.status === BlogStatus.PUBLISHED,
      );
    }

    // Search filter
    if (this.search().length > 0) {
      const searchTerm = this.search().toLowerCase();
      temporal = temporal.filter((blog) => {
        const author = blog.author?.fullName || '';
        return (
          blog.title.toLowerCase().includes(searchTerm) ||
          blog.content.toLowerCase().includes(searchTerm) ||
          author.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Category filter
    if (this.category().length > 0) {
      temporal = temporal.filter((blog) => blog.categoryId === this.category());
    }

    // Type filter
    if (this.type() === 'recent') {
      temporal = temporal.sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
      );
    }

    if (this.type() === 'popular') {
      temporal = temporal.sort((a, b) => (b.reaction || 0) - (a.reaction || 0));
    }

    if (this.type() === 'my-blogs') {
      temporal = temporal.filter((blog) => blog.author?.uid === user?.uid);
    }

    return temporal;
  });

  getUserLetters(user?: UserModel) {
    if (!user || !user.fullName) return '??';
    const names = user.fullName.split(' ');
    const firstInitial = names[0]?.[0] ?? '?';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getCategoryName(categoryId?: string | null) {
    if (!categoryId) return 'Sin categoría';
    const category = this.categories.value()?.find((c) => c.id === categoryId);
    return category?.nameTranslations?.['es'] || 'Sin categoría';
  }

  setType(type: string) {
    this.type.set(type as 'default' | 'recent' | 'popular' | 'my-blogs');
  }

  goToBlog(blogId: string) {
    this.router.navigate(['/app/community/post', blogId]);
  }

  goToBlogCommentSection(event: Event, blogId: string) {
    event.stopPropagation();
    this.router.navigate(['/app/community/post', blogId], {
      fragment: 'comments',
    });
  }

  goToCreateBlog() {
    this.router.navigate(['/app/community/post']);
  }

  reload() {
    this.blogs.reload();
  }

  clearFilters() {
    this.search.set('');
    this.category.set('');
    this.type.set('default');
  }
}

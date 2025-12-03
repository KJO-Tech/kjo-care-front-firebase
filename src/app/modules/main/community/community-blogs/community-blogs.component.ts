import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, tap } from 'rxjs';
import { Blog, BlogStatus } from '../../../../core/models/blog';
import { UserModel } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogService } from '../../../../core/services/blog.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'community-blogs',
  templateUrl: './community-blogs.component.html',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class CommunityBlogsComponent {
  private router = inject(Router);
  private blogService = inject(BlogService);
  private reactionService = inject(ReactionService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Cache for blogs to prevent loading on back navigation
  private blogsCache = signal<Blog[] | null>(null);

  blogs = rxResource({
    loader: () => {
      // If we have cached data, return it immediately and refresh in background
      if (this.blogsCache()) {
        // Return cached data immediately
        const cached$ = of(this.blogsCache()!);

        // Refresh in background
        this.blogService.findAll().subscribe((freshBlogs) => {
          this.blogsCache.set(freshBlogs);
        });

        return cached$;
      }

      // No cache, fetch and cache
      return this.blogService
        .findAll()
        .pipe(tap((blogs) => this.blogsCache.set(blogs)));
    },
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
    const lastInitial =
      names.length > 1 ? names[names.length - 1][0] || '' : '';
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
    // Find the blog to pass it via state for view transitions
    const blog = this.filteredBlogs().find((b) => b.id === blogId);

    this.router.navigate(['/app/community/post', blogId], {
      state: { blog }, // Pass blog data for instant rendering
    });
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

  toggleLike(event: Event, blogId: string) {
    event.stopPropagation();
    const user = this.authService.userData();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.reactionService.toggleLike(blogId).subscribe({
      next: () => {
        // this.blogs.reload();
      },
      error: (error: any) => {
        console.error('Error toggling reaction:', error);
      },
    });
  }

  shareBlog(event: Event, blog: Blog) {
    event.stopPropagation();
    if (!blog) return;

    const shareData = {
      title: blog.title,
      text: blog.content.substring(0, 100) + '...',
      url: window.location.href + '/post/' + blog.id,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log('Blog shared successfully'))
        .catch((error) => console.error('Error sharing blog:', error));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(
        () => {
          this.toastService.addToast({
            message: 'Enlace copiado al portapapeles',
            type: 'success',
            duration: 3000,
          });
        },
        (err) => {
          console.error('Could not copy text: ', err);
          this.toastService.addToast({
            message: 'Error al copiar el enlace',
            type: 'error',
            duration: 3000,
          });
        },
      );
    }
  }
}

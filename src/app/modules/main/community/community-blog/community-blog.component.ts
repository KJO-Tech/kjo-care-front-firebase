import { DatePipe, Location } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { Blog } from '../../../../core/models/blog';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogService } from '../../../../core/services/blog.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CommentService } from '../../../../core/services/comment.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { BlogCommentModalComponent } from '../../../blog/blog-comment-modal/blog-comment-modal.component';
import { CommunityBlogCommentComponent } from '../components/community-blog-comment/community-blog-comment.component';
import { CommunityCommentFormComponent } from '../components/community-comment-form/community-comment-form.component';

@Component({
  selector: 'app-community-blog',
  templateUrl: './community-blog.component.html',
  imports: [
    DialogComponent,
    CommunityBlogCommentComponent,
    CommunityCommentFormComponent,
    BlogCommentModalComponent,
    DatePipe,
    RouterLink,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class CommunityBlogComponent {
  private route = inject(ActivatedRoute);
  public router = inject(Router); // Make public for template access
  private location = inject(Location);

  private authService = inject(AuthService);
  blogService = inject(BlogService);
  private reactionService = inject(ReactionService);
  commentService = inject(CommentService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  isLoading = signal(true);
  blogId = signal('');
  selectedCommentId = signal<string | null>(null);

  userId = computed(() => this.authService.userData()?.uid);

  readonly blog = rxResource({
    request: () => this.blogId(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.blogService.getById(request).pipe(
        map((blog) => {
          this.isLoading.set(false);
          if (blog) {
            this.blogService.selectedBlog = blog;
            this.updateSEO(blog);
          }
          return blog;
        }),
      );
    },
  });

  readonly commentsResource = rxResource({
    request: () => this.blogId(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.commentService.getComments(request);
    },
  });

  readonly categories = rxResource({
    loader: () => this.categoryService.findAll(),
  });

  constructor() {
    effect(() => {
      this.route.paramMap.subscribe((params) => {
        this.blogId.set(params.get('id') ?? '');
      });
    });
  }

  private updateSEO(blog: Blog) {
    this.titleService.setTitle(`${blog.title} | KJO Mind Care`);
    this.metaService.updateTag({
      name: 'description',
      content: blog.content.substring(0, 150) + '...',
    });
    if (blog.mediaUrl) {
      this.metaService.updateTag({
        property: 'og:image',
        content: blog.mediaUrl,
      });
    }
  }

  checkAuth(): boolean {
    if (!this.userId()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return false;
    }
    return true;
  }

  toggleLike() {
    if (!this.checkAuth()) return;

    const blog = this.blog.value();
    if (!blog) return;

    this.reactionService.toggleLike(this.blogId()).subscribe({
      next: () => {
        this.blog.reload();
      },
      error: (error: any) => {
        this.toastService.addToast({
          message: 'Error al reaccionar',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  openDeleteCommentModal(commentId: string) {
    if (!this.checkAuth()) return;
    this.selectedCommentId.set(commentId);
    const modal = document.getElementById(
      'modal_blog_comment_delete',
    ) as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  confirmDeleteComment() {
    const commentId = this.selectedCommentId();
    if (!commentId) return;

    this.commentService.delete(this.blogId(), commentId).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Comentario eliminado',
          type: 'success',
          duration: 4000,
        });
        this.commentsResource.reload();
        this.blog.reload();
        this.selectedCommentId.set(null);
      },
      error: () => {
        this.toastService.addToast({
          message: 'Error eliminando el comentario',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  getUserLetters(user?: any) {
    const fullName = user?.fullName || user?.displayName || '?';
    return fullName.substring(0, 2).toUpperCase();
  }

  openDeleteBlogModal() {
    if (!this.checkAuth()) return;
    const modal = document.getElementById(
      'modal_blog_delete',
    ) as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  confirmDeleteBlog() {
    const blog = this.blog.value();
    if (!blog) return;

    this.blogService.delete(blog.id).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Post eliminado con éxito',
          type: 'success',
          duration: 4000,
        });

        this.router.navigate(['/app/community']);
      },
      error: (error) => {
        this.toastService.addToast({
          message: 'Error eliminando el post',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  reload() {
    this.blog.reload();
    this.commentsResource.reload();
  }

  redirectToEdit() {
    if (!this.checkAuth()) return;
    this.router.navigate(['/app/community/post'], {
      queryParams: { id: this.blogId() },
    });
  }

  goBack() {
    this.location.back();
  }

  getCategoryName(categoryId?: string | null): string {
    if (!categoryId) return 'Sin categoría';
    const category = this.categories.value()?.find((c) => c.id === categoryId);
    return category?.nameTranslations['es'] || 'Sin categoría';
  }

  shareBlog() {
    const blog = this.blog.value();
    if (!blog) return;

    const shareData = {
      title: blog.title,
      text: blog.content.substring(0, 100) + '...',
      url: window.location.href,
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

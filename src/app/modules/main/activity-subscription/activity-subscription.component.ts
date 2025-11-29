import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityCategoryService } from '../../../core/services/activity-category.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-activity-subscription',
  templateUrl: './activity-subscription.component.html',
  imports: [CommonModule],
})
export default class ActivitySubscriptionComponent implements OnInit {
  private categoryService = inject(ActivityCategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  selectedCategories = signal<string[]>([]);
  isSaving = signal(false);
  returnUrl = signal<string | null>(null);

  ngOnInit() {
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || null);

    // Load existing subscriptions if any
    this.categoryService.getUserSubscriptions().subscribe({
      next: (subs) => {
        this.selectedCategories.set(subs);
      },
      error: (err) => console.error('Error loading subscriptions', err),
    });
  }

  isSelected(categoryId: string): boolean {
    return this.selectedCategories().includes(categoryId);
  }

  toggleSelection(categoryId: string) {
    this.selectedCategories.update((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      } else {
        return [...current, categoryId];
      }
    });
  }

  skip() {
    this.navigateAway();
  }

  saveSubscriptions() {
    this.isSaving.set(true);
    const categoryIds = this.selectedCategories();

    // We need a bulk update method or loop.
    // Since we don't have a bulk set method in service yet, let's assume we can loop
    // or better yet, update the service to accept a list.
    // Actually, the service has subscribe/unsubscribe single.
    // I should probably add a `updateSubscriptions(categoryIds: string[])` to the service for efficiency.
    // For now, I'll implement a loop here but it's not atomic.
    // Wait, the service has `getUserSubscriptions`.
    // Let's add `updateUserSubscriptions` to the service first?
    // Or just use what we have.
    // The user didn't ask for a new service method, but it's cleaner.
    // I'll add `updateUserSubscriptions` to the service in the next step.
    // For now, I'll assume it exists or I'll implement it.

    // Let's implement the loop for now to avoid blocking, but I'll add the method to service next.
    // Actually, I'll just call the service update method I plan to create.

    this.categoryService.updateUserSubscriptions(categoryIds).subscribe({
      next: () => {
        this.toastService.addToast({
          message: 'Suscripciones guardadas',
          type: 'success',
          duration: 3000,
        });
        this.navigateAway();
      },
      error: (err) => {
        this.toastService.addToast({
          message: 'Error al guardar suscripciones',
          type: 'error',
          duration: 3000,
        });
        this.isSaving.set(false);
      },
    });
  }

  private navigateAway() {
    const url = this.returnUrl();
    if (url) {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigate(['/app']);
    }
  }
}

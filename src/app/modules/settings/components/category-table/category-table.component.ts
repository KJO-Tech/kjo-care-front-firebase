import { Component, inject } from '@angular/core';

import { rxResource } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ModalOpenButtonComponent } from '../../../../shared/components/modal-open-button/modal-open-button.component';
import { CategoryModalComponent } from '../category-modal/category-modal.component';

@Component({
  selector: 'category-table',
  templateUrl: './category-table.component.html',
  imports: [ModalOpenButtonComponent, CategoryModalComponent, DialogComponent],
})
export class CategoryTableComponent {
  categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  categories = rxResource({
    loader: () => this.categoryService.findAll(),
  });

  constructor() {}

  reload() {
    this.categories.reload();
  }

  deleteCategory() {
    this.categoryService
      .delete(this.categoryService.selectedCategory().id)
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: 'Category deleted successfully',
            type: 'success',
            duration: 4000,
          });

          this.reload();
        },
        error: (error) => {
          this.toastService.addToast({
            message: 'Error deleting category',
            type: 'error',
            duration: 4000,
          });
        },
      });
  }

  toggleCategory(category: any) {
    this.categoryService
      .toggleStatus(category.id, category.isActive)
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: 'Category status updated successfully',
            type: 'success',
            duration: 3000,
          });
          this.reload();
        },
        error: (error) => {
          this.toastService.addToast({
            message: 'Error updating category status',
            type: 'error',
            duration: 4000,
          });
        },
      });
  }
}

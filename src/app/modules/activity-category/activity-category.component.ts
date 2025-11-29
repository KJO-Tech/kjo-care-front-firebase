import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivityCategory } from '../../core/models/activity.model';
import { ActivityCategoryService } from '../../core/services/activity-category.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ModalOpenButtonComponent } from '../../shared/components/modal-open-button/modal-open-button.component';
import { ActivityCategoryModalComponent } from './activity-category-modal/activity-category-modal.component';

@Component({
  selector: 'app-activity-categories',
  standalone: true,
  templateUrl: './activity-category.component.html',
  imports: [
    ReactiveFormsModule,
    ActivityCategoryModalComponent,
    ModalOpenButtonComponent,
    DialogComponent,
  ],
})
export default class ActivityCategoryComponent {
  private categoryService = inject(ActivityCategoryService);
  private toastService = inject(ToastService);

  categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  selectedCategory = signal<ActivityCategory | null>(null);

  reload() {
    this.categoriesResource.reload();
  }

  openCreateModal() {
    this.selectedCategory.set({
      id: '',
      localizedName: {},
      localizedDescription: {},
      imageUrl: '',
      order: 0,
    });
  }

  openEditModal(category: ActivityCategory) {
    this.selectedCategory.set(category);
  }

  deleteCategory(category: ActivityCategory) {
    this.selectedCategory.set(category);
  }

  deleteConfirmed() {
    this.categoryService
      .deleteCategory(this.selectedCategory()?.id!!)
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: 'Categoría eliminada correctamente',
            type: 'success',
            duration: 4000,
          });
          this.reload();
        },
        error: (err) => {
          this.toastService.addToast({
            message: 'Error al eliminar la categoría',
            type: 'error',
            duration: 4000,
          });
        },
      });
  }
}

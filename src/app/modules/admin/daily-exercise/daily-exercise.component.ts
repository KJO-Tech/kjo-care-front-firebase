import { Component, signal, inject, computed } from '@angular/core';
import { DailyExerciseService } from '../../../core/services/daily-exercise.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DailyExercise,
  ActivityCategory,
} from '../../../core/models/activity.model';
import { ExerciseModalComponent } from './exercise-modal/exercise-modal.component';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivityCategoryService } from '../../../core/services/activity-category.service';

@Component({
  selector: 'app-daily-exercises',
  standalone: true,
  templateUrl: './daily-exercise.component.html',
  imports: [ExerciseModalComponent, ModalOpenButtonComponent, DialogComponent],
})
export default class DailyExerciseComponent {
  private exerciseService = inject(DailyExerciseService);
  private categoryService = inject(ActivityCategoryService);
  private toastService = inject(ToastService);

  exercisesResource = rxResource({
    loader: () => this.exerciseService.getExercises(),
  });

  categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  categoriesMap = computed(() => {
    const categories = this.categoriesResource.value();
    if (!categories) return new Map<string, string>();
    return new Map(
      categories.map((c) => [c.id, c.localizedName['es'] || 'Unknown']),
    );
  });

  selectedExercise = signal<DailyExercise | null>(null);

  reload() {
    this.exercisesResource.reload();
    this.categoriesResource.reload();
  }

  openCreateModal() {
    this.selectedExercise.set(null);
  }

  openEditModal(exercise: DailyExercise) {
    this.selectedExercise.set(exercise);
  }

  deleteExercise(exercise: DailyExercise) {
    this.selectedExercise.set(exercise);
  }

  deleteConfirmed() {
    this.exerciseService
      .deleteExercise(this.selectedExercise()?.id!!)
      .subscribe({
        next: () => {
          this.toastService.addToast({
            message: 'Ejercicio eliminado',
            type: 'success',
            duration: 4000,
          });
          this.exercisesResource.reload();
        },
        error: (err) => {
          this.toastService.addToast({
            message: 'Error al eliminar',
            type: 'error',
            duration: 4000,
          });
        },
      });
  }
}

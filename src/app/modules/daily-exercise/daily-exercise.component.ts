import { Component, signal, effect, computed, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DailyExerciseService } from '../../core/services/daily-exercise.service';
import { ToastService } from '../../core/services/toast.service';
import { DailyExercise } from '../../core/models/activity.model';
import { ExerciseModalComponent } from './exercise-modal/exercise-modal.component';
import { ModalOpenButtonComponent } from '../../shared/components/modal-open-button/modal-open-button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';

@Component({
  selector: 'app-daily-exercises',
  standalone: true,
  template: `
    <div class="flex justify-between items-center gap-2 flex-wrap mb-3 p-2">
      <h1 class="sm:text-2xl text-xl font-bold">Ejercicios Diarios</h1>
      <modal-open-button
        modalName="modal_exercise"
        [classes]="'btn-primary'"
        (click)="openCreateModal()"
      >
        Agregar Ejercicio
      </modal-open-button>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoría</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @if (isLoading()) {
            <tr>
              <td colspan="4">
                <div class="flex justify-center p-4">
                  <span class="loading loading-spinner loading-lg text-primary"></span>
                </div>
              </td>
            </tr>
          } @else if (error()) {
            <tr>
              <td colspan="4">
                <div class="alert alert-error mt-4">
                  <i class="material-symbols-outlined !text-xl">error</i>
                  <span>{{ error() }}</span>
                  <button class="btn btn-sm" (click)="reload()">
                    Reiniciar
                  </button>
                </div>
              </td>
            </tr>
          } @else {
            @for (exercise of exercises(); track exercise.id) {
              <tr class="hover:bg-base-200">
                <td>{{ exercise.localizedTitle['es'] || 'Sin título' }}</td>
                <td>{{ exercise.categoryId }}</td>
                <td>{{ exercise.contentType }}</td>
                <td class="flex items-center gap-1">
                  <modal-open-button
                    [modalName]="'modal_exercise'"
                    [type]="'icon'"
                    (click)="openEditModal(exercise)"
                  >
                    <i class="material-symbols-outlined !text-xl">edit_square</i>
                  </modal-open-button>

                  <modal-open-button
                    [modalName]="'modal_exercise_delete'"
                    [type]="'icon'"
                    (click)="deleteExercise(exercise)"
                  >
                    <i class="material-symbols-outlined !text-xl">delete</i>
                  </modal-open-button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="text-center">
                  <p>No hay ejercicios disponibles.</p>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <app-exercise-modal (close)="reload()" [exercise]="selectedExercise()"></app-exercise-modal>

    <app-dialog
      [title]="'Delete exercise'"
      [message]="'Are you sure you want to delete this exercise?'"
      [modalName]="'modal_exercise_delete'"
      [buttonText]="'Delete'"
      (callback)="deleteConfirmed()"
    ></app-dialog>
  `,
  imports: [ExerciseModalComponent, ModalOpenButtonComponent, DialogComponent]
})
export default class DailyExerciseComponent implements OnInit {
  private exerciseService = inject(DailyExerciseService);
  private toastService = inject(ToastService);

  exercises = signal<DailyExercise[]>([]);
  selectedExercise = signal<DailyExercise | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadExercises();
  }

  loadExercises() {
    this.isLoading.set(true);
    this.exerciseService.getExercises().subscribe({
      next: (exercises) => {
        this.exercises.set(exercises);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  reload() {
    this.loadExercises();
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
    this.exerciseService.deleteExercise(this.selectedExercise()?.id!!).subscribe({
      next: () => {
        this.toastService.addToast({ message: 'Ejercicio eliminado', type: 'success', duration:4000 });
        this.loadExercises();
      },
      error: (err) => {
        this.toastService.addToast({ message: 'Error al eliminar', type: 'error', duration:4000 });
      }
    });
  }
}

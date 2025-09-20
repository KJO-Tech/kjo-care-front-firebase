import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MoodModalComponent } from '../components/mood-modal/mood-modal.component';
import { MoodStateService } from '../../../core/services/mood-tracking.service';
import type { Content } from '../../../core/models/mood.model';
import type { MoodStateRequest, MoodStateResponse } from '../../../core/interfaces/mood-http.interface';
import { ToastService } from '../../../core/services/toast.service';
import { NEVER, timer } from 'rxjs';

@Component({
  selector: 'setting-mood-state',
  imports: [FormsModule, MoodModalComponent],
  templateUrl: './setting-mood-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingMoodStateComponent {
  private moodStateService = inject(MoodStateService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly moodStateSignal = signal<MoodStateRequest>({
    name: "",
    description: "",
    image: "",
    color: "#6d28d9",
    materialIcon: ""
  });

  readonly moodStateResource = rxResource({
    request: () => this.moodStateSignal(),
    loader: () => this.isMoodStateEmpty(this.moodStateSignal()) ? NEVER : this.moodStateService.addMoodState(this.moodStateSignal())
  });

  readonly loadMoodTracking = rxResource({
    loader: () => this.moodStateService.getMoods(),
    defaultValue: [] as MoodStateResponse[]
  });

  editingMood = signal<Content | null>(null);
  isNewMood = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  moodToDelete = signal<string>("");

  constructor() {
    effect(() => {
      if (this.showDeleteModal()) {
        timer(0).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
          const modal = document.getElementById('delete_confirmation_modal') as HTMLDialogElement;
          modal?.showModal();
        });
      }
    });

    effect(() => {
      if (this.editingMood()) {
        timer(50).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
          const modal = document.getElementById('mood_editor_modal') as HTMLDialogElement;
          modal?.showModal();
        });
      }
    });
  }

  private isMoodStateEmpty(moodState: MoodStateRequest): boolean {
    return !moodState.name.trim() || !moodState.color.trim();
  }

  addMoodState(): void {
    const newMood: Content = {
      id: "",
      name: "",
      description: "",
      color: "#6d28d9",
      isActive: true,
      state: "active",
      image: ""
    };

    this.isNewMood.set(true);
    this.editingMood.set(newMood);
  }

  toggleMoodState(id: string): void {
    this.moodStateService.toggleMoodState(id).subscribe({
      next: () => {
        this.loadMoodTracking.reload();
        this.toastService.addToast({
          type: 'success',
          message: 'Estado de ánimo actualizado correctamente',
          duration: 3000
        });
      },
      error: () => {
        this.toastService.addToast({
          type: 'error',
          message: 'Error al actualizar el estado de ánimo',
          duration: 3000
        });
      }
    });
  }

  editMood(index: number): void {
    const mood = this.loadMoodTracking.value()?.[index];
    if (mood) {
      this.isNewMood.set(false);
      this.editingMood.set(mood as Content);
    }
  }

  deleteMood(id: string): void {
    this.moodToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.moodToDelete();
    if (id) {
      this.moodStateService.removeMoodState(id).subscribe({
        next: () => {
          this.loadMoodTracking.reload();
          this.closeDeleteModal();
          this.toastService.addToast({
            type: 'success',
            message: 'Estado de ánimo eliminado correctamente',
            duration: 3000
          });
        },
        error: () => {
          this.closeDeleteModal();
          this.toastService.addToast({
            type: 'error',
            message: 'Error al eliminar el estado de ánimo',
            duration: 3000
          });
        }
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.moodToDelete.set("");
    const modal = document.getElementById('delete_confirmation_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  handleSaveMood(mood: Content): void {
    if (this.isNewMood()) {
      this.moodStateService.addMoodState(mood as unknown as MoodStateRequest)
        .subscribe({
          next: () => {
            this.loadMoodTracking.reload();
            this.cancelEdit();
            this.toastService.addToast({
              type: 'success',
              message: 'Estado de ánimo creado correctamente',
              duration: 3000
            });
          },
          error: () => {
            this.toastService.addToast({
              type: 'error',
              message: 'Error al crear el estado de ánimo',
              duration: 3000
            });
          }
        });
    } else {
      this.moodStateService.updateMoodState(mood.id, mood)
        .subscribe({
          next: () => {
            this.loadMoodTracking.reload();
            this.cancelEdit();
            this.toastService.addToast({
              type: 'success',
              message: 'Estado de ánimo actualizado correctamente',
              duration: 3000
            });
          },
          error: () => {
            this.toastService.addToast({
              type: 'error',
              message: 'Error al actualizar el estado de ánimo',
              duration: 3000
            });
          }
        });
    }
  }

  cancelEdit(): void {
    this.editingMood.set(null);
    this.isNewMood.set(false);
  }
}

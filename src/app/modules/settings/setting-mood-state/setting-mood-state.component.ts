import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { MoodModalComponent } from '../components/mood-modal/mood-modal.component';
import { MoodStateService } from '../../../core/services/mood-tracking.service';
import type { Content } from '../../../core/models/mood.model';
import type { MoodStateRequest, MoodStateResponse } from '../../../core/interfaces/mood-http.interface';
import { ToastService } from '../../../core/services/toast.service';
import { NEVER } from 'rxjs';

@Component({
  selector: 'setting-mood-state',
  imports: [FormsModule, MoodModalComponent],
  templateUrl: './setting-mood-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingMoodStateComponent {
  private moodStateService = inject(MoodStateService);
  private toastService = inject(ToastService);

  readonly moodStateSignal = signal<MoodStateRequest>({
    name: "",
    description: "",
    image: "",
    color: "#6d28d9",
    materialIcon: ""
  })

  readonly moodStateResource = rxResource({
    request: () => this.moodStateSignal(),
    loader: () => this.isMoodStateEmpty(this.moodStateSignal()) ? NEVER : this.moodStateService.addMoodState(this.moodStateSignal())
  })
  readonly loadMoodTracking = rxResource({
    loader: () => this.moodStateService.getMoods(),
    defaultValue: [] as MoodStateResponse[]
  });
  editingMood = signal<Content | null>(null);
  isNewMood = signal<boolean>(false);
  showSuccessToast = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false)
  moodToDelete = signal<string>("")
  constructor() {
    effect(() => {
      if (this.showSuccessToast()) {
        setTimeout(() => this.showSuccessToast.set(false), 3000);
      }
    });
    effect(() => {
      if (this.showDeleteModal()) {
        // Usar setTimeout para asegurar que el DOM esté actualizado
        setTimeout(() => {
          const modal = document.getElementById('delete_confirmation_modal') as HTMLDialogElement;
          if (modal) {
            modal.showModal();
          }
        }, 0);
      }
    });
  }

  private isMoodStateEmpty(moodState: MoodStateRequest): boolean {
    return !moodState.name.trim() || !moodState.color.trim()
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

    // Abrir el modal
    const modal = document.getElementById('mood_editor_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  toggleMoodState(id: string): void {
    this.moodStateService.toggleMoodState(id).subscribe(() => this.loadMoodTracking.reload())

  }

  editMood(index: number): void {
    const mood = this.loadMoodTracking.value()?.[index];
    if (mood) {
      this.isNewMood.set(false);
      this.editingMood.set(mood as Content);

      const modal = document.getElementById('mood_editor_modal') as HTMLDialogElement;
      if (modal) {
        modal.showModal();
      }
    }
  }

  deleteMood(id: string): void {
    this.moodToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.moodToDelete();
    if (id) {
      this.moodStateService.removeMoodState(id).subscribe(() => {
        this.loadMoodTracking.reload();
        this.showSuccessToast.set(true);
        this.closeDeleteModal();
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
      // Si es nuevo, usar addMoodState
      this.moodStateService.addMoodState(mood as unknown as MoodStateRequest)
        .subscribe(() => {
          this.loadMoodTracking.reload();
          this.showSuccessToast.set(true);
        });
    } else {
      // Si es edición, usar updateMoodState
      this.moodStateService.updateMoodState(mood.id, mood)
        .subscribe(() => {
          this.loadMoodTracking.reload();
          this.showSuccessToast.set(true);
        });
    }
  }
  cancelEdit(): void {
    this.editingMood.set(null);
    this.isNewMood.set(false);
  }
}

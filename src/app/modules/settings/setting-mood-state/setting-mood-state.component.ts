import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { MoodModalComponent } from '../components/mood-modal/mood-modal.component';
import { MoodStateService } from '../../../core/services/mood-tracking.service';
import type { Content } from '../../../core/models/mood.model';
import type { MoodStateRequest } from '../../../core/interfaces/mood-http.interface';

@Component({
  selector: 'setting-mood-state',
  imports: [FormsModule, MoodModalComponent],
  templateUrl: './setting-mood-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingMoodStateComponent {
  private moodStateService = inject(MoodStateService);
  readonly moodStateSignal = signal<MoodStateRequest>({
    name: "",
    description: "",
    image: "",
    color: "#6d28d9",
    materialIcon: ""
  })
  readonly moodStateResource = rxResource({
    request: () => this.moodStateSignal(),
    loader: () => this.moodStateService.addMoodState(this.moodStateSignal())
  })
  readonly loadMoodTracking = rxResource({
    loader: () => this.moodStateService.getMoods()
  });

  constructor() {
    effect(() => {
      this.loadMoodTracking.reload();
    });

    effect(() => {
      if (this.showSuccessToast()) {
        setTimeout(() => this.showSuccessToast.set(false), 3000);
      }
    });
  }

  editingMood = signal<Content | null>(null);
  editingIndex = signal<number>(-1);


  showSuccessToast = signal<boolean>(false);



  addMoodState(): void {
    this.moodStateResource.reload();
    

  }

  toggleMoodState(id: string): void {



  }

  editMood(index: number): void {

  }

  deleteMood(id: string): void {

  }

  confirmDelete(): void {

  }

  handleSaveMood(mood: Content): void {

  }

  cancelEdit(): void {
    this.editingMood.set(null);
    this.editingIndex.set(-1);
  }
}

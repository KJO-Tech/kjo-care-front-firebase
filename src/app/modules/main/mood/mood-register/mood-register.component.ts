import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MoodStateResponse } from '../../../../core/interfaces/mood-http.interface';
import { MoodEntryService } from '../../../../core/services/mood-entry.service';
import { MoodStateService } from '../../../../core/services/mood-tracking.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'mood-register',
  templateUrl: './mood-register.component.html',
  imports: [NgClass, FormsModule],
})
export default class MoodRegisterComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private moodService = inject(MoodStateService);
  private moodEntryService = inject(MoodEntryService);
  private toastService = inject(ToastService);

  moods = rxResource({
    loader: () => {
      return this.moodService.getMoods();
    },
  });

  moodsContent = computed(() => {
    const moods = this.moods.value() as MoodStateResponse[] | undefined;
    if (!moods) return [];
    return moods
      .filter((mood) => mood.isActive)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  });

  moodId = signal<string>('');
  moodSelected = signal<string>('');
  moodDescription = signal<string>('');

  isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.route.queryParamMap.subscribe((params) => {
        this.moodId.set(params.get('moodId') ?? '');
      });

      if (this.moodId() !== '') {
        this.moodSelected.set(this.moodId());
      }
    });
  }

  selectMood(id: string) {
    if (this.moodSelected() === id) {
      this.moodSelected.set('');
    } else {
      this.moodSelected.set(id);
    }
  }

  saveMyMood() {
    if (this.moodSelected() !== '') {
      this.isLoading.set(true);

      this.moodEntryService
        .addMoodEntry(this.moodSelected(), this.moodDescription())
        .subscribe({
          next: () => {
            this.router.navigate(['/app/mood/recorded']);
          },
          error: () => {
            this.toastService.addToast({
              message: 'Error al guardar el estado de animo',
              type: 'error',
              duration: 5000,
            });
            this.isLoading.set(false);
          },
          complete: () => {
            this.isLoading.set(false);
          },
        });
    }
  }

  reload() {
    this.moods.reload();
  }
}

import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MoodStateService } from '../../../../../core/services/mood-tracking.service';

@Component({
  selector: 'home-mood-register',
  imports: [NgClass],
  templateUrl: './home-mood-register.component.html',
})
export class HomeMoodRegisterComponent {
  router = inject(Router);
  moodService = inject(MoodStateService);

  moods = rxResource({
    loader: () => {
      return this.moodService.getMoods();
    },
  });

  moodsContent = computed(() => {
    let moods = this.moods.value() ?? [];
    return moods
      .filter((mood) => mood.isActive)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  });

  moodSelected = signal<string>('');

  selectMood(id: string) {
    if (this.moodSelected() === id) {
      this.moodSelected.set('');
    } else {
      this.moodSelected.set(id);
    }
  }

  redirectToMoodRegister() {
    if (this.moodSelected() !== '') {
      this.router.navigate(['/app/mood'], {
        queryParams: { moodId: this.moodSelected() },
      });
    }
  }

  reload() {
    this.moods.reload();
  }
}

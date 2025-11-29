import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MoodEntry } from '../../../../core/interfaces/mood-entry.interface';
import { Mood } from '../../../../core/models/mood.model';
import { MoodEntryService } from '../../../../core/services/mood-entry.service';
import { MoodStateService } from '../../../../core/services/mood-tracking.service';

@Component({
  selector: 'mood-history',
  templateUrl: './mood-history.component.html',
  imports: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class MoodHistoryComponent {
  private router = inject(Router);
  private moodEntryService = inject(MoodEntryService);
  private moodService = inject(MoodStateService);

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  // Load entries
  entries = rxResource({
    loader: () => this.moodEntryService.getMoodEntries(),
  });

  history = computed(() => {
    const entries = this.entries.value() as MoodEntry[] | undefined;
    const moods = this.moodDefinitions.value() as Mood[] | undefined;

    if (!entries || !moods) return [];

    return entries.map((entry) => {
      let mood: Mood | undefined;
      if (entry.moodId) {
        mood = moods.find((m) => m.id === entry.moodId);
      } else if (entry.mood) {
        mood = moods.find(
          (m) => m.name['en'] === entry.mood || m.name['es'] === entry.mood,
        );
      }

      return {
        ...entry,
        moodDetails: mood,
        date:
          entry.createdAt instanceof Date
            ? entry.createdAt
            : entry.createdAt.toDate(),
      };
    });
  });

  registerMood() {
    this.router.navigate(['/app/mood/register']);
  }

  reload() {
    this.entries.reload();
  }
}

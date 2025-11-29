import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MoodEntryService } from '../../../../../core/services/mood-entry.service';
import { UserMoodAnalyticsComponent } from '../user-mood-analytics/user-mood-analytics.component';

@Component({
  selector: 'mood-weekly-history',
  templateUrl: './weekly-history.component.html',
  imports: [CommonModule, UserMoodAnalyticsComponent],
})
export class WeeklyHistoryComponent {
  private moodEntryService = inject(MoodEntryService);

  withDetails = input<boolean>(false);

  // Load weekly history from service
  weeklyHistoryResource = rxResource({
    loader: () => this.moodEntryService.getWeeklyHistory(),
  });

  // Load stats from service
  statsResource = rxResource({
    loader: () => this.moodEntryService.getWeeklyStats(),
  });

  weeklyHistory = computed(() => {
    return this.weeklyHistoryResource.value() || [];
  });

  stats = computed(() => {
    return (
      this.statsResource.value() || {
        average: 0,
        registeredDays: 0,
        improvement: 0,
      }
    );
  });

  reload() {
    this.weeklyHistoryResource.reload();
    this.statsResource.reload();
  }
}

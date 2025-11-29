import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { MoodStateService } from '../../../core/services/mood-tracking.service';
import { MoodEntry } from '../../../core/interfaces/mood-entry.interface';
import { Mood } from '../../../core/models/mood.model';

@Component({
  selector: 'mood-heatmap',
  imports: [CommonModule],
  templateUrl: './mood-heatmap.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodHeatmapComponent {
  private analyticsService = inject(AnalyticsService);
  private moodService = inject(MoodStateService);
  private route = inject(ActivatedRoute);

  // Time range
  selectedTimeRange = signal<string>('Last Month');

  // Display data
  weeks = signal<
    { days: { date: Date; color: string; mood?: string; value?: number }[] }[]
  >([]);

  // Month labels for X axis
  monthLabels = signal<{ label: string; offset: number }[]>([]);

  // Cache for day colors to avoid recalculating in template
  private dayColorMap = new Map<string, string>();

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  // Resource for heatmap data
  heatmapResource = rxResource({
    request: () => ({ months: this.getMonthsForRange() }),
    loader: ({ request }) =>
      this.analyticsService.getMoodEntries(request.months),
  });

  constructor() {
    // Sync query params to selectedTimeRange
    this.route.queryParams.subscribe((params) => {
      if (params['range']) {
        this.selectedTimeRange.set(params['range']);
      }
    });

    effect(() => {
      const entries = this.heatmapResource.value();
      const moods = this.moodDefinitions.value();

      if (entries && moods) {
        this.processHeatmapData(entries, moods);
      }
    });
  }

  getMonthsForRange(): number {
    switch (this.selectedTimeRange()) {
      case 'Last Week':
        return 0.25;
      case 'Last Month':
        return 1;
      case 'Last 3 Months':
        return 3;
      case 'Last Year':
        return 12;
      default:
        return 3;
    }
  }

  processHeatmapData(entries: MoodEntry[], moods: Mood[]) {
    const now = new Date();
    const range = this.selectedTimeRange();
    let daysCount = 30;

    if (range === 'Last Week') daysCount = 7;
    else if (range === 'Last Month') daysCount = 30;
    else if (range === 'Last 3 Months') daysCount = 90;
    else if (range === 'Last Year') daysCount = 365;

    // Calculate start date
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysCount);

    // Align start date to the previous Sunday (to start the grid correctly)
    const dayOfWeek = startDate.getDay(); // 0 = Sunday
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Calculate total days to cover until today (or end of this week)
    const endDate = new Date(now);
    // Optional: Align end date to next Saturday?
    // For now, let's just ensure we cover enough weeks.

    const weeks: {
      days: { date: Date; color: string; mood?: string; value?: number }[];
    }[] = [];
    let currentWeek: {
      date: Date;
      color: string;
      mood?: string;
      value?: number;
    }[] = [];

    // Iterate day by day from startDate
    const iterDate = new Date(startDate);
    // We want to go until we pass 'now' and finish the current week
    while (iterDate <= now || iterDate.getDay() !== 0) {
      const dateStr = iterDate.toDateString();
      const entry = entries.find(
        (e) => e.createdAt.toDate().toDateString() === dateStr,
      );

      let color = '#ebedf0'; // GitHub empty cell color (light mode)
      // Or use base-200 from daisyUI if we want to match theme?
      // Let's use a variable or class, but here we return color string.
      // Better to use transparent or a specific gray.
      // Let's stick to a light gray for empty.

      let moodLabel = undefined;
      let value = undefined;

      if (entry) {
        let mood: Mood | undefined;
        if (entry.moodId) {
          mood = moods.find((m) => m.id === entry.moodId);
        } else if (entry.mood) {
          mood = moods.find(
            (m) => m.name['en'] === entry.mood || m.name['es'] === entry.mood,
          );
        }
        if (mood) {
          color = mood.color;
          moodLabel = mood.name['es'] || mood.name['en'];
          value = mood.value;
        }
      }

      currentWeek.push({
        date: new Date(iterDate),
        color,
        mood: moodLabel,
        value,
      });

      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }

      iterDate.setDate(iterDate.getDate() + 1);

      // Safety break to avoid infinite loop if logic fails
      if (weeks.length > 60) break;
    }

    // Push last partial week if any (shouldn't happen if we align correctly but good safety)
    if (currentWeek.length > 0) {
      weeks.push({ days: currentWeek });
    }

    this.weeks.set(weeks);
    this.generateMonthLabels(weeks);
  }

  generateMonthLabels(weeks: { days: { date: Date }[] }[]) {
    const labels: { label: string; offset: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      // Check the first day of the week (Sunday)
      const date = week.days[0].date;
      const month = date.getMonth();

      if (month !== lastMonth) {
        // Add label
        const monthName = date.toLocaleString('default', { month: 'short' });
        labels.push({ label: monthName, offset: index });
        lastMonth = month;
      }
    });

    this.monthLabels.set(labels);
  }
}

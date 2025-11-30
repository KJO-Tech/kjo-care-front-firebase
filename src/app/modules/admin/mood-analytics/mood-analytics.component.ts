import { DecimalPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { MoodAnalyticsResponse } from '../../../core/interfaces/mood-analytics.response';
import { Mood } from '../../../core/models/mood.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { MoodStateService } from '../../../core/services/mood-tracking.service';
import { SettingAnalysisComponent } from './setting-analysis/setting-analysis.component';

interface MoodDisplay {
  label: string;
  percent: number;
  entries: number;
  delta: number;
  color: string;
  icon?: string;
  image?: string;
}

@Component({
  selector: 'mood-analytics',
  templateUrl: './mood-analytics.component.html',
  styleUrl: './mood-analytics.component.css',
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SettingAnalysisComponent,
    NgClass,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodAnalyticsComponent {
  private moodAnalytics = inject(AnalyticsService);
  private moodService = inject(MoodStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  analyticsResource = rxResource({
    request: () => ({ months: this.getMonthsForRange() }),
    loader: ({ request }) =>
      this.moodAnalytics.getMoodAnalytics(request.months),
  });

  moods = signal<MoodDisplay[]>([]);

  ranges = signal<string[]>([
    'Last Week',
    'Last Month',
    'Last 3 Months',
    'Last Year',
  ]);
  selectedRange = signal<string>('Last 3 Months');

  tabs = signal<{ name: string; path: string; icon: string }[]>([
    { name: 'Mood Heatmap', path: 'mood-heatmap', icon: 'grid_view' },
    { name: 'Mood Distribution', path: 'mood-distribution', icon: 'pie_chart' },
    { name: 'Mood Trends', path: 'mood-trends', icon: 'show_chart' },
  ]);

  activeTab = signal<string>('Mood Heatmap');

  constructor() {
    // Sync query params to selectedRange
    this.route.queryParams.subscribe((params) => {
      if (params['range']) {
        this.selectedRange.set(params['range']);
      }
    });

    effect(() => {
      const analyticsData = this.analyticsResource.value();
      const moodDefs = this.moodDefinitions.value();

      if (analyticsData && moodDefs) {
        this.processMoodData(analyticsData, moodDefs);
      }
    });
  }

  private processMoodData(data: MoodAnalyticsResponse, moodDefs: Mood[]): void {
    const newMoods: MoodDisplay[] = [];

    // Filter active moods or show all that have data?
    // Usually show active ones + ones with data even if inactive.
    // For now, let's iterate over defined moods.

    for (const moodDef of moodDefs) {
      // Try to match by ID first, then by name (legacy)
      // The analytics service returns keys. Ideally keys are IDs or Names.
      // Our analytics service logic tries to use Name (EN/ES) or ID.

      // We need to check all possible keys for this mood definition
      const possibleKeys = [
        moodDef.id,
        moodDef.name['en'],
        moodDef.name['es'],
      ].filter((k) => !!k);

      let entries = 0;
      let percent = 0;

      // Sum up counts if multiple keys match (e.g. legacy name + new ID)
      // Though analytics service likely normalizes to one key per entry.
      // But we need to find which key in 'data.moodCounts' corresponds to this moodDef.

      // Actually, the analytics service logic I wrote tries to normalize to ONE key per entry.
      // But here we don't know which key was used for a specific entry without checking the data.
      // Let's iterate over the data keys and see if they match this moodDef.

      Object.keys(data.moodCounts).forEach((key) => {
        if (
          possibleKeys.includes(key) ||
          key === moodDef.name['en'] ||
          key === moodDef.name['es']
        ) {
          entries += data.moodCounts[key] || 0;
          // Percentages might be tricky to sum if they are pre-calculated, better to recalc or sum
          // But since totalEntries is available:
        }
      });

      if (data.totalEntries > 0) {
        percent = Number(((entries / data.totalEntries) * 100).toFixed(1));
      }

      // Only add if it has entries or is active
      if (entries > 0 || moodDef.isActive) {
        newMoods.push({
          label: moodDef.name['es'] || moodDef.name['en'] || 'Unknown', // Prefer Spanish for display or use current locale
          percent,
          entries,
          delta: 0, // Delta logic would require previous period data
          color: moodDef.color,
          image: moodDef.image,
        });
      }
    }

    // Sort by entries or percent desc
    newMoods.sort((a, b) => b.entries - a.entries);

    this.moods.set(newMoods);
  }

  updateRange(range: string): void {
    this.selectedRange.set(range);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { range: range },
      queryParamsHandling: 'merge', // Merge with existing params
    });
    // Resource reload is handled by signal dependency if we used request() in rxResource,
    // but here we might need to trigger it if getMonthsForRange uses the signal.
    // Yes, getMonthsForRange uses selectedRange(), so if we use request() in rxResource it will auto-reload.
    // I updated analyticsResource to use request() above.
  }

  private getMonthsForRange(): number {
    switch (this.selectedRange()) {
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

  setActiveTab(tabName: string): void {
    this.activeTab.set(tabName);
  }

  navigateToTab(tabPath: string): void {
    this.router.navigate(['/dashboard/moods', tabPath]);
  }

  export(): void {
    console.log('Exporting Mood Analytics data...');
  }
}

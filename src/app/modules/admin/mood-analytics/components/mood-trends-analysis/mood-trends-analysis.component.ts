import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  Input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../../../../../core/services/analytics.service';
import { MoodStateService } from '../../../../../core/services/mood-tracking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'trends-analysis',
  imports: [CommonModule, FormsModule],
  templateUrl: './mood-trends-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodTrendsAnalysisComponent {
  private analyticsService = inject(AnalyticsService);
  private moodService = inject(MoodStateService);

  month = signal<number>(3);

  @Input()
  set range(value: string) {
    let months = 3;
    switch (value) {
      case 'Last Week':
        months = 0.25;
        break;
      case 'Last Month':
        months = 1;
        break;
      case 'Last 3 Months':
        months = 3;
        break;
      case 'Last Year':
        months = 12;
        break;
      default:
        months = 3;
    }
    this.month.set(months);
  }

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  loadTrendsAnalysis = rxResource({
    request: () => ({ month: this.month() }),
    loader: ({ request }) =>
      this.analyticsService.getMoodTrendsAnalysis(request.month),
  });

  getTrendColor(direction: string): string {
    switch (direction) {
      case 'Improving':
        return '#36d399'; // success
      case 'Declining':
        return '#f87272'; // error
      default:
        return '#3abff8'; // info
    }
  }

  getTrendIcon(direction: string): string {
    switch (direction) {
      case 'Improving':
        return 'trending_up';
      case 'Declining':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  getVariabilityColor(level: string): string {
    switch (level) {
      case 'Low':
        return '#36d399'; // success
      case 'Moderate':
        return '#fbbd23'; // warning
      case 'High':
        return '#f87272'; // error
      default:
        return '#3abff8'; // info
    }
  }

  getMoodIcon(moodKey: string): string {
    const moods = this.moodDefinitions.value();
    if (!moods) return 'mood';

    // Try to find by name (legacy or current) or ID
    const mood = moods.find(
      (m) =>
        m.name['en'] === moodKey ||
        m.name['es'] === moodKey ||
        m.id === moodKey,
    );

    return 'mood';
  }

  getMoodImage(moodKey: string): string | undefined {
    const moods = this.moodDefinitions.value();
    if (!moods) return undefined;

    const mood = moods.find(
      (m) =>
        m.name['en'] === moodKey ||
        m.name['es'] === moodKey ||
        m.id === moodKey,
    );

    return mood?.image;
  }

  getMoodColor(moodKey: string): string {
    const moods = this.moodDefinitions.value();
    if (!moods) return '#570df8'; // primary

    const mood = moods.find(
      (m) =>
        m.name['en'] === moodKey ||
        m.name['es'] === moodKey ||
        m.id === moodKey,
    );

    return mood ? mood.color : '#570df8'; // primary
  }
}

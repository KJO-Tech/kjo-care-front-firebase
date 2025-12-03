import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AnalyticsService } from '../../../../../core/services/analytics.service';

@Component({
  selector: 'home-statistics',
  templateUrl: './statistics.component.html',
})
export class StatisticsComponent {
  private analyticsService = inject(AnalyticsService);

  stats = rxResource({
    loader: () =>
      this.analyticsService
        .getHomeStatistics()
        .pipe(map((response) => response)),
  });

  reload() {
    this.stats.reload();
  }
}

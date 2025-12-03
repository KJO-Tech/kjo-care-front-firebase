import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AnalyticsService } from '../../../../../core/services/analytics.service';

@Component({
  selector: 'home-achievements',
  templateUrl: './achievements.component.html',
})
export class AchievementsComponent {
  private analyticsService = inject(AnalyticsService);

  stats = rxResource({
    loader: () => this.analyticsService.getHomeStatistics(),
  });

  reload() {
    this.stats.reload();
  }
}

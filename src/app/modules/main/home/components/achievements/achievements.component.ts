import { Component } from '@angular/core';

@Component({
  selector: 'home-achievements',
  imports: [],
  templateUrl: './achievements.component.html',
})
export class AchievementsComponent {
  //
  // analyticsService = inject(AnalyticsService);
  //
  // stats = rxResource({
  //   loader: () => this.analyticsService.getSummary().pipe(
  //     map((response) => response.result)
  //   )
  // });
  //
  // reload() {
  //   this.stats.reload();
  // }
}

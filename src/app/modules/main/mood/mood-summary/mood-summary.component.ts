import { Component } from '@angular/core';
import { WeeklyHistoryComponent } from '../../home/components/weekly-history/weekly-history.component';

@Component({
  selector: 'mood-summary',
  templateUrl: './mood-summary.component.html',
  imports: [WeeklyHistoryComponent],
})
export default class MoodSummaryComponent {}

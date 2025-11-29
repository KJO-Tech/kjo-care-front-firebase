import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MoodTrendsAnalysisComponent } from '../components/mood-trends-analysis/mood-trends-analysis.component';
import { PopularBlogComponent } from '../components/popular-blog/popular-blog.component';

@Component({
  selector: 'setting-analysis',
  imports: [MoodTrendsAnalysisComponent, PopularBlogComponent],
  templateUrl: './setting-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingAnalysisComponent {
  @Input() range: string = 'Last 3 Months';
}

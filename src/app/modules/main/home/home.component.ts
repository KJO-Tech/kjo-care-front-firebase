import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { DailyActivitiesComponent } from './components/daily-activities/daily-activities.component';
import { HomeMoodRegisterComponent } from './components/home-mood-register/home-mood-register.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { WeeklyHistoryComponent } from './components/weekly-history/weekly-history.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [
    AchievementsComponent,
    StatisticsComponent,
    HomeMoodRegisterComponent,
    WeeklyHistoryComponent,
    DailyActivitiesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  userService = inject(AuthService);

  userName = computed(() => {
    const names = this.userService.userData()?.fullName ?? 'Usuario';
    return names.split(' ')[0];
  });
}

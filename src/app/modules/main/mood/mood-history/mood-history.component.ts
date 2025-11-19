import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'mood-history',
  templateUrl: './mood-history.component.html',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class MoodHistoryComponent {
  // private router = inject(Router);
  //
  // private moodUserService = inject(MoodTrackingUserService);
  //
  // moods = rxResource({
  //   loader: () => {
  //     return this.moodUserService.getMyMoods().pipe(
  //       map((response) => response.result)
  //     );
  //   }
  // });
  //
  // registerMood() {
  //   this.router.navigate(['/app/mood/register']);
  // }
  //
  // reload() {
  //   this.moods.reload();
  // }
  //
  // protected readonly formatDateToISO8601 = formatDateToISO8601;
}

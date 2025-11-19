import { Component } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'home-daily-activities',
  templateUrl: './daily-activities.component.html',
  imports: [NgClass],
})
export class DailyActivitiesComponent {
  // private router = inject(Router);
  // private exercisesService = inject(DailyExerciseService);
  //
  // activities = rxResource({
  //   loader: () => this.exercisesService.getMyDailyExercises().pipe(
  //     map((response) => response.result)
  //   )
  // });
  //
  // goToExercise(id: string) {
  //   this.router.navigate([`/app/exercises/${id}`]);
  // }
  //
  // reload() {
  //   this.activities.reload();
  // }
}

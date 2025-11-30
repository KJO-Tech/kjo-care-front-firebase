import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER } from 'rxjs';
import { ExerciseDifficultyType } from '../../../../core/models/activity.model';
import { DailyExerciseService } from '../../../../core/services/daily-exercise.service';

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  imports: [NgClass],
})
export class ExerciseListComponent {
  private exerciseService = inject(DailyExerciseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Input from route param
  categoryId = signal<string | null>(null);

  exercisesResource = rxResource({
    request: () => this.categoryId(),
    loader: ({ request: categoryId }) =>
      categoryId
        ? this.exerciseService.getExercisesByCategory(categoryId)
        : NEVER,
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.categoryId.set(params.get('categoryId'));
    });
  }

  selectExercise(exerciseId: string) {
    this.router.navigate(['/app/exercises', exerciseId]);
  }

  goBack() {
    this.router.navigate(['/app/exercises']);
  }

  ExerciseDifficultyType = ExerciseDifficultyType;
}

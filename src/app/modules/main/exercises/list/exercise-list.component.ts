import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NEVER } from 'rxjs';
import { ExerciseDifficultyType } from '../../../../core/models/activity.model';
import { ActivityCategoryService } from '../../../../core/services/activity-category.service';
import { DailyExerciseService } from '../../../../core/services/daily-exercise.service';

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  imports: [NgClass, RouterLink],
})
export class ExerciseListComponent {
  private exerciseService = inject(DailyExerciseService);
  private categoryService = inject(ActivityCategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Input from route param
  categoryId = signal<string | null>(null);

  categoryResource = rxResource({
    request: () => this.categoryId(),
    loader: ({ request: categoryId }) =>
      categoryId ? this.categoryService.getCategoryById(categoryId) : NEVER,
  });

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

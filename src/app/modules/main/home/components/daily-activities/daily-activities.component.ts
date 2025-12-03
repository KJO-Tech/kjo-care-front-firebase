import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ActivityCategoryService } from '../../../../../core/services/activity-category.service';
import { DailyExerciseService } from '../../../../../core/services/daily-exercise.service';

@Component({
  selector: 'home-daily-activities',
  templateUrl: './daily-activities.component.html',
  imports: [NgClass],
})
export class DailyActivitiesComponent {
  private router = inject(Router);
  private exercisesService = inject(DailyExerciseService);
  private categoryService = inject(ActivityCategoryService);

  userSubscriptionsResource = rxResource({
    loader: () => this.categoryService.getUserSubscriptions(),
  });

  categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  dailyAssignmentsResource = rxResource({
    loader: () => this.exercisesService.getDailyAssignments(),
  });

  goToExercise(id: string) {
    this.router.navigate([`/app/exercises/${id}`]);
  }

  goToExercises() {
    this.router.navigate(['/app/exercises']);
  }

  reload() {
    this.userSubscriptionsResource.reload();
    this.dailyAssignmentsResource.reload();
    this.categoriesResource.reload();
  }

  getCategoryImage(categoryId: string) {
    const categories = this.categoriesResource.value() ?? [];
    const category = categories.find((category) => category.id === categoryId);
    return category?.imageUrl;
  }
}

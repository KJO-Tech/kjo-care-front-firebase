import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ActivityCategoryService } from '../../../../core/services/activity-category.service';

@Component({
  selector: 'app-exercise-categories',
  templateUrl: './exercise-categories.component.html',
  imports: [],
})
export class ExerciseCategoriesComponent {
  private categoryService = inject(ActivityCategoryService);
  private router = inject(Router);

  categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  selectCategory(categoryId: string) {
    this.router.navigate(['/app/exercises/category', categoryId]);
  }
}

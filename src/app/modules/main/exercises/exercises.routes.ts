import { Routes } from '@angular/router';
import { ExerciseCategoriesComponent } from './categories/exercise-categories.component';
import { ExerciseDetailComponent } from './detail/exercise-detail.component';
import { ExerciseListComponent } from './list/exercise-list.component';

export default [
  {
    path: '',
    component: ExerciseCategoriesComponent,
  },
  {
    path: 'category/:categoryId',
    component: ExerciseListComponent,
  },
  {
    path: ':id',
    component: ExerciseDetailComponent,
  },
] as Routes;

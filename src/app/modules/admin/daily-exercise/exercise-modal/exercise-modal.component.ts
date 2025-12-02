import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DailyExerciseService } from '../../../../core/services/daily-exercise.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormUtils } from '../../../../shared/utils/form-utils';
import {
  ActivityCategory,
  DailyExercise,
  ExerciseContentType,
  ExerciseDifficultyType,
} from '../../../../core/models/activity.model';
import { ActivityCategoryService } from '../../../../core/services/activity-category.service';

@Component({
  selector: 'app-exercise-modal',
  standalone: true,
  templateUrl: './exercise-modal.component.html',
  imports: [ReactiveFormsModule],
})
export class ExerciseModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private exerciseService = inject(DailyExerciseService);
  private toastService = inject(ToastService);
  private categoryService = inject(ActivityCategoryService);

  categories = signal<ActivityCategory[]>([]);

  exercise = input<DailyExercise | null>(null);
  title = computed(() =>
    this.exercise() ? 'Editar Ejercicio' : 'Nuevo Ejercicio',
  );
  nameButton = computed(() => (this.exercise() ? 'Actualizar' : 'Guardar'));

  close = output();

  exerciseForm = this.fb.group({
    category: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    titleEn: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    descriptionEn: ['', [Validators.required, Validators.minLength(5)]],
    duration: [0],
    content: [''],
    contentEn: [''],
    contentUrl: [''],
    contentType: [ExerciseContentType.TEXT, [Validators.required]],
    difficulty: [ExerciseDifficultyType.BEGINNER, [Validators.required]],
    thumbnailUrl: [''],
  });

  constructor() {
    effect(() => {
      if (this.exercise()) {
        this.exerciseForm.patchValue({
          title: this.exercise()?.localizedTitle['es'],
          titleEn: this.exercise()?.localizedTitle['en'],
          description: this.exercise()?.localizedDescription['es'],
          descriptionEn: this.exercise()?.localizedDescription['en'],
          content: this.exercise()?.localizedContentText['es'],
          contentEn: this.exercise()?.localizedContentText['en'],
          contentType: this.exercise()?.contentType,
          contentUrl: this.exercise()?.contentUrl,
          thumbnailUrl: this.exercise()?.thumbnailUrl,
          category: this.exercise()?.categoryId,
          difficulty: this.exercise()?.difficulty,
          duration: this.exercise()?.durationMinutes || 0,
        });
      } else {
        this.exerciseForm.reset({
          duration: 0,
          contentType: ExerciseContentType.TEXT,
          difficulty: ExerciseDifficultyType.BEGINNER,
        });
      }
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: () => {
        this.toastService.addToast({
          message: 'Hubo un error al cargar las categorias',
          type: 'success',
          duration: 4000,
        });
      },
    });
  }

  onSubmit() {
    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      console.log('Formulario inválido');
      return;
    }

    const exercise: Omit<DailyExercise, 'id'> = {
      categoryId: this.exerciseForm.value.category!,
      localizedTitle: {
        es: this.exerciseForm.value.title!,
        en: this.exerciseForm.value.titleEn!,
      },
      localizedDescription: {
        es: this.exerciseForm.value.description!,
        en: this.exerciseForm.value.descriptionEn!,
      },
      durationMinutes: this.exerciseForm.value.duration!,
      contentType: this.exerciseForm.value.contentType!,
      contentUrl: this.exerciseForm.value.contentUrl!,
      localizedContentText: {
        es: this.exerciseForm.value.content!,
        en: this.exerciseForm.value.contentEn!,
      },
      thumbnailUrl: this.exerciseForm.value.thumbnailUrl!,
      difficulty: this.exerciseForm.value.difficulty!,
      tags: [],
    };

    if (this.exercise()?.id) {
      this.exerciseService
        .updateExercise(this.exercise()?.id!!, exercise)
        .subscribe({
          next: () => {
            this.toastService.addToast({
              message: 'Ejercicio actualizado',
              type: 'success',
              duration: 4000,
            });
            this.exerciseForm.reset();
            this.exerciseForm.clearValidators();
            this.close.emit();
          },
          error: (err) => {
            this.toastService.addToast({
              message: 'Error al actualizar',
              type: 'error',
              duration: 4000,
            });
          },
        });
    } else {
      this.exerciseService.createExercise(exercise).subscribe({
        next: (id) => {
          this.toastService.addToast({
            message: 'Ejercicio creado',
            type: 'success',
            duration: 4000,
          });
          this.exerciseForm.reset();
          this.exerciseForm.clearValidators();
          this.close.emit();
        },
        error: (err) => {
          this.toastService.addToast({
            message: 'Error al crear',
            type: 'error',
            duration: 4000,
          });
        },
      });
    }
  }

  protected readonly Object = Object;
  protected readonly ExerciseContentType = ExerciseContentType;
  protected readonly FormUtils = FormUtils;
  protected readonly ExerciseDifficultyType = ExerciseDifficultyType;
}

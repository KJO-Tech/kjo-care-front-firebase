import {
  Component,
  signal,
  effect,
  input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  computed,
  output
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivityCategoryService } from '../../../core/services/activity-category.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormUtils } from '../../../shared/utils/form-utils';
import { ActivityCategory } from '../../../core/models/activity.model';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  template: `
    <dialog id="modal_activity_category" class="modal">
      <div class="modal-box max-h-11/12">
        <!-- X BUTTON -->
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <i class="material-icons-outlined !text-xl">close</i>
          </button>
        </form>

        <h2 class="text-lg font-semibold">{{ title() }}</h2>

        <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Nombre</legend>
            <input
              type="text"
              class="input validator w-full"
              formControlName="name"
              placeholder="Nombre de la categoría"
              required
              autocomplete="off"
            />
            <p class="validator-hint hidden">
              {{ FormUtils.getFieldError(categoryForm, 'name') }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Nombre en Inglés</legend>
            <input
              type="text"
              class="input validator w-full"
              formControlName="nameEn"
              placeholder="Nombre de la categoría en Inglés"
              required
              autocomplete="off"
            />
            <p class="validator-hint hidden">
              {{ FormUtils.getFieldError(categoryForm, 'nameEn') }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Descripción</legend>
            <input
              type="text"
              class="input validator w-full"
              formControlName="description"
              placeholder="Descripción de la categoría"
              required
              autocomplete="off"
            >
            <p class="validator-hint hidden">
              {{ FormUtils.getFieldError(categoryForm, 'description') }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Descripción en Inglés</legend>
            <input
              type="text"
              class="input validator w-full"
              formControlName="descriptionEn"
              placeholder="Descripción de la categoría en Inglés"
              required
              autocomplete="off"
            >
            <p class="validator-hint hidden">
              {{ FormUtils.getFieldError(categoryForm, 'descriptionEn') }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Nombre del ícono</legend>
            <input
              type="text"
              class="input validator w-full"
              formControlName="iconName"
              placeholder="Nombre del ícono"
              required
              autocomplete="off"
            >
            <p class="validator-hint hidden">
              {{ FormUtils.getFieldError(categoryForm, 'iconName') }}
            </p>
          </fieldset>

          <div class="modal-action mt-4">
            <form method="dialog" class="space-x-2">
              <button class="btn">Cerrar</button>

              <button
                class="btn btn-primary"
                [disabled]="categoryForm.invalid"
                type="submit"
                (click)="onSubmit()"
              >
                {{ nameButton() }}
              </button>
            </form>

          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  `,
  imports: [
    ReactiveFormsModule
  ]
})
export class ActivityCategoryModalComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(ActivityCategoryService);
  private toastService = inject(ToastService);

  category = input<ActivityCategory | null>(null);
  title = computed(() => this.category()?.id ? 'Editar Categoría' : 'Nueva Categoría');
  nameButton = computed(() => this.category()?.id ? 'Actualizar' : 'Guardar');

  reload = output()

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    nameEn: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    descriptionEn: ['', [Validators.required, Validators.minLength(3)]],
    iconName: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor() {
    effect(() => {
      if (this.category()) {
        this.categoryForm.patchValue({
          name: this.category()?.localizedName['es'],
          nameEn: this.category()?.localizedName['en'],
          description: this.category()?.localizedDescription['es'],
          descriptionEn: this.category()?.localizedDescription['en'],
          iconName: this.category()?.iconResName
        });
      }
    });
  }

  onSubmit() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      console.log('Formulario inválido');
      return;
    }

    const category: Omit<ActivityCategory, 'id'> = {
      localizedName: { es: this.categoryForm.value.name!, en: this.categoryForm.value.nameEn! },
      localizedDescription: { es: this.categoryForm.value.description!, en: this.categoryForm.value.descriptionEn! },
      iconResName: this.categoryForm.value.iconName!,
      order: 0
    };

    if (this.category()?.id) {
      this.categoryService.updateCategory(this.category()?.id!, category).subscribe({
        next: () => {
          this.toastService.addToast({ message: 'Categoría actualizada', type: 'success', duration: 4000 });
          this.categoryForm.reset();
          this.categoryForm.clearValidators()
          this.reload.emit()
        },
        error: (err) => {
          this.toastService.addToast({ message: 'Error al actualizar', type: 'error', duration: 4000 });
        }
      });
    } else {
      this.categoryService.createCategory(category).subscribe({
        next: (id) => {
          this.toastService.addToast({ message: 'Categoría creada', type: 'success', duration: 4000 });
          this.categoryForm.reset();
          this.categoryForm.clearValidators()
          this.reload.emit()
        },
        error: (err) => {
          this.toastService.addToast({ message: 'Error al crear', type: 'error', duration: 4000 });
        }
      });
    }
  }

  protected readonly FormUtils = FormUtils;
}

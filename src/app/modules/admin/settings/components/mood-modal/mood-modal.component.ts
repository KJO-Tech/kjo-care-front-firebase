import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Mood } from '../../../../../core/models/mood.model';

@Component({
  selector: 'app-mood-modal',
  templateUrl: './mood-modal.component.html',
  imports: [ReactiveFormsModule],
  styles: `
    .color-picker {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodModalComponent implements OnInit {
  modalId = input<string>('mood_editor_modal');
  mood = input<Mood>({
    id: '',
    name: { es: '', en: '' },
    color: '#9172FE',
    isActive: true,
    description: { es: '', en: '' },
    image: '',
    value: 0,
  });
  isNewMood = input<boolean>(false);

  save = output<Mood>();
  cancel = output<void>();

  moodForm!: FormGroup;

  colorPresets: string[] = [
    '#68D391',
    '#90CDF4',
    '#9F7AEA',
    '#FBD38D',
    '#F6AD55',
    '#9172FE',
  ];

  constructor(private fb: FormBuilder) {
    effect(() => {
      const currentMood = this.mood();
      if (this.moodForm) {
        this.moodForm.patchValue({
          nameEs: currentMood.name['es'],
          nameEn: currentMood.name['en'],
          color: currentMood.color,
          descriptionEs: currentMood.description['es'] || '',
          descriptionEn: currentMood.description['en'] || '',
          image: currentMood.image || '',
          value: currentMood.value || 0,
        });
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const currentMood = this.mood();

    this.moodForm = this.fb.group({
      nameEs: [
        currentMood.name['es'],
        [Validators.required, Validators.minLength(2)],
      ],
      nameEn: [
        currentMood.name['en'],
        [Validators.required, Validators.minLength(2)],
      ],
      color: [currentMood.color, Validators.required],
      descriptionEs: [currentMood.description['es'] || ''],
      descriptionEn: [currentMood.description['en'] || ''],
      image: [currentMood.image || ''],
      value: [currentMood.value || 0, [Validators.required, Validators.min(0)]],
    });
  }

  setMoodColor(color: string): void {
    this.moodForm.patchValue({ color });
  }

  saveMood(): void {
    if (this.moodForm.invalid) {
      Object.keys(this.moodForm.controls).forEach((key) => {
        const control = this.moodForm.get(key);
        control?.markAsTouched();
      });

      return;
    }

    const formValue = this.moodForm.value;
    const updatedMood: Mood = {
      ...this.mood(),
      name: {
        es: formValue.nameEs,
        en: formValue.nameEn,
      },
      description: {
        es: formValue.descriptionEs,
        en: formValue.descriptionEn,
      },
      color: formValue.color,
      image: formValue.image,
      value: formValue.value,
      isActive: this.mood().isActive, // Preserve active state
    };

    this.save.emit(updatedMood);
    this.closeModal();
  }

  cancelEdit(): void {
    this.cancel.emit();
    this.closeModal();
  }

  closeModal(): void {
    const modal = document.getElementById(this.modalId()) as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  get nameEsControl() {
    return this.moodForm.get('nameEs');
  }
  get nameEnControl() {
    return this.moodForm.get('nameEn');
  }
  get colorControl() {
    return this.moodForm.get('color');
  }
  get imageControl() {
    return this.moodForm.get('image');
  }
  get isActiveControl() {
    return this.moodForm.get('isActive');
  }
}

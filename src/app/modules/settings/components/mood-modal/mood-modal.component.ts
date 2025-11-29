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
import { CommonModule } from '@angular/common';
import { Mood } from '../../../../core/models/mood.model';

@Component({
  selector: 'app-mood-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mood-modal.component.html',
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
    name: '',
    color: '#9172FE',
    isActive: true,
    description: '',
    image: '',
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
          name: currentMood.name,
          color: currentMood.color,
          description: currentMood.description || '',
          image: currentMood.image || '',
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
      name: [currentMood.name, [Validators.required, Validators.minLength(2)]],
      color: [currentMood.color, Validators.required],
      description: [currentMood.description || ''],
      image: [currentMood.image || ''],
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

    const updatedMood: Mood = {
      ...this.mood(),
      ...this.moodForm.value,
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

  get nameControl() {
    return this.moodForm.get('name');
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

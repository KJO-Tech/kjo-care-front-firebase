import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER } from 'rxjs';
import { DailyExerciseService } from '../../../../core/services/daily-exercise.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  imports: [],
})
export class ExerciseDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private exercisesService = inject(DailyExerciseService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  // Input from route param
  id = signal<string | null>(null);

  exerciseResource = rxResource({
    request: () => this.id(),
    loader: ({ request: id }) =>
      id ? this.exercisesService.getExerciseById(id) : NEVER,
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.id.set(params.get('id'));
    });
  }

  safeVideoUrl = computed(() => {
    const exercise = this.exerciseResource.value();
    if (exercise && exercise.contentType === 'VIDEO' && exercise.contentUrl) {
      let videoUrl = exercise.contentUrl;

      // Handle YouTube URLs to ensure they are embeddable
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const regex =
          /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/;
        const match = videoUrl.match(regex);
        if (match && match[1]) {
          videoUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=0&controls=1&modestbranding=1&rel=0`;
        }
      }

      return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }
    return null;
  });

  isStandardVideo = computed(() => {
    const exercise = this.exerciseResource.value();
    return (
      exercise &&
      exercise.contentType === 'VIDEO' &&
      !!exercise.contentUrl &&
      !exercise.contentUrl.includes('youtube.com') &&
      !exercise.contentUrl.includes('youtu.be')
    );
  });

  markAsComplete() {
    this.exercisesService.completeAdHocExercise(this.id() || '').subscribe({
      next: () => {
        this.toastService.addToast({
          message: '¡Ejercicio completado con éxito!',
          type: 'success',
          duration: 4000,
        });
        this.router.navigate(['/app/home']);
      },
      error: () => {
        this.toastService.addToast({
          message: 'Ocurrió un error al marcar el ejercicio como completado.',
          type: 'error',
          duration: 4000,
        });
      },
    });
  }

  goBack() {
    this.location.back();
  }

  reload() {
    this.exerciseResource.reload();
  }
}

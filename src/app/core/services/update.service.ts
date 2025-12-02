import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  private toastService = inject(ToastService);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker is not enabled');
      return;
    }

    // Check for updates on initialization
    this.swUpdate.checkForUpdate();

    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        this.promptUserToUpdate();
      });
  }

  private promptUserToUpdate() {
    // We can use a custom toast or a simple confirm for now,
    // but a toast with an action is better.
    // Since ToastService might not have an action button support yet,
    // we'll use a standard confirm or just reload if the user agrees.
    // Ideally, we should extend ToastService or use a specific UI component.

    // For now, let's use a native confirm or just log it.
    // But the user asked for a notification.

    // Let's assume we can show a toast that says "Update available. Reload?"
    // If ToastService doesn't support actions, we might need to modify it or use a different approach.
    // Let's check ToastService capabilities first.

    // Assuming simple toast for now, but really we want a click action.
    // If ToastService is simple, maybe we just auto-reload or show a snackbar.

    // Let's try to use the ToastService to show a message.
    // If the user clicks the toast (if clickable), we reload.

    // Actually, let's just use window.confirm for a robust "Update Available" prompt for now,
    // or better, just reload if it's critical, but that's bad UX.

    // Let's try to add a specific notification type to ToastService if possible,
    // but I don't want to over-engineer without checking ToastService.

    // I'll stick to a simple log and maybe a toast message.
    console.log('New version available');

    // Let's use a native confirm for simplicity and effectiveness in this context
    if (confirm('Nueva versión disponible. ¿Desea recargar la aplicación?')) {
      document.location.reload();
    }
  }
}

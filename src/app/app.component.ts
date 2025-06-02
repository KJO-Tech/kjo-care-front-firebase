import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/layout/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  template: `
@if (authService.isLoading()) {
  <main class="flex flex-col items-center justify-center h-screen w-screen">
    <div class="flex items-center justify-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </main>
} @else if (shouldShowWelcome()) {
  <main class="flex flex-col items-center justify-center h-screen w-screen">
    <div class="card bg-neutral text-primary-content max-w-96 m-4">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold">KJO Mind Care</h2>
        <p class="text-md">
          Welcome to the dashboard of the KJO Mind Care application.
        </p>
        <div class="card-actions flex-col *:w-full mt-2">
          <button (click)="router.navigate(['/auth/login'])" class="btn btn-primary">
            Login
          </button>
        </div>
      </div>
    </div>
  </main>
} @else {
  <router-outlet />
}

<app-toast></app-toast>
  `,
})
export class AppComponent {
  authService = inject(AuthService);
  router = inject(Router);

  shouldShowWelcome() {
    const currentRoute = this.router.url;
    return !this.authService.isAuthenticated() && currentRoute === '/';
  }
}
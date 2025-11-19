import { Router, type CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow access to community post detail without login
  if (state.url.match(/\/app\/community\/post\/[a-zA-Z0-9-]+/)) {
    return true;
  }

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      router.navigate(['/auth/login']);
      return false;
    }),
  );
};

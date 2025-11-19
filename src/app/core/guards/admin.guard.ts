import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userData$ = toObservable(authService.userData);
  const isLoading$ = toObservable(authService.isLoading);

  return isLoading$.pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => userData$),
    filter((userData) => userData !== undefined), // Wait until userData is defined (null or object)
    take(1),
    map((userData) => {
      if (userData?.role === 'admin') {
        return true;
      }

      if (authService.isAuthenticated()) {
        router.navigate(['/app']);
      } else {
        router.navigate(['/auth/login']);
      }
      return false;
    }),
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, take, filter, switchMap, of } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userData$ = toObservable(authService.userData);
  const isLoading$ = toObservable(authService.isLoading);

  return isLoading$.pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => {
      if (!authService.isAuthenticated()) {
        return of(true);
      }

      return userData$.pipe(
        filter((userData) => userData !== undefined),
        take(1),
        map((userData) => {
          if (userData?.role === 'admin') {
            router.navigate(['/dashboard']);
          } else {
            router.navigate(['/app']);
          }
          return false;
        }),
      );
    }),
  );
};

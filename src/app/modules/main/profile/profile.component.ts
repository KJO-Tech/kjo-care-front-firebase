import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [],
})
export default class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userData;

  editProfile(): void {
    this.router.navigate(['/app/profile/edit']);
  }

  manageSubscriptions(): void {
    this.router.navigate(['/app/activity-subscription'], {
      queryParams: { returnUrl: '/app/profile' },
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}

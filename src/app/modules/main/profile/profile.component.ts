import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
})
export default class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userData;

  editProfile(): void {
    // Placeholder for edit profile logic
    console.log('Edit profile clicked');
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

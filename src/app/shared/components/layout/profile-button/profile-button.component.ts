import { Component, computed, inject } from '@angular/core';
import { KeycloakService } from '../../../../modules/auth/services/keycloak.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'navbar-profile-button',
  templateUrl: './profile-button.component.html',
  imports: [
    RouterLink
  ]
})
export class ProfileButtonComponent {
  private authService = inject(AuthService)
  readonly currentUser = this.authService.currentUser
  readonly isLoading = this.authService.isLoading

  readonly userAvatar = computed(() => {
    const user = this.currentUser()
    return user?.photoURL
  })

  readonly userLetters = computed(() => {
    const user = this.currentUser();
    if (!user?.displayName && !user?.email) return '?';

    const name = user.displayName || user.email?.split('@')[0] || '?';
    const words = name.trim().split(' ');

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  });
  readonly userName = computed(() => {
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  });

  logout() {
    this.authService.logout().subscribe();
  }

  async account() {
    // await this.keycloakService.goToAccountManagement();Z
  }
}

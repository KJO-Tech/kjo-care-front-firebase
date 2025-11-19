import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KeycloakService } from '../../auth/services/keycloak.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {

  private authService = inject(AuthService)


  user = this.authService.currentUser();
  userEmail = computed(() => this.user?.email ?? 'Usuario');
  isLoading = this.authService.isLoading;

  async logout() {
    await this.authService.logout();
  }

  async account() {

  }

}

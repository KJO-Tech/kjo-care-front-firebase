import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsComponent } from '../../shared/components/layout/notifications/notifications.component';
import { ThemeControllerComponent } from '../../shared/components/layout/theme-controller/theme-controller.component';

@Component({
  selector: 'app-main',
  imports: [
    RouterLink,
    RouterLinkActive,
    NotificationsComponent,
    RouterOutlet,
    NgClass,
    ThemeControllerComponent,
  ],
  templateUrl: './main.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainComponent {
  private readonly authService = inject(AuthService);

  isAdmin = computed(() => this.authService.userData()?.role === 'admin');

  links = [
    {
      name: 'Inicio',
      path: '/app',
      icon: 'home',
    },
    {
      name: 'Ánimo',
      path: '/app/mood',
      icon: 'emoji_emotions',
    },
    {
      name: 'Comunidad',
      path: '/app/community',
      icon: 'diversity_1', // groups
    },
    {
      name: 'Recursos',
      path: '/app/resources',
      icon: 'vertical_split',
    },
    {
      name: 'Perfil',
      path: '/app/profile',
      icon: 'person',
    },
  ];
}

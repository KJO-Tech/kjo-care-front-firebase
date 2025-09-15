import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationsComponent } from '../../shared/components/layout/notifications/notifications.component';
import { ProfileButtonComponent } from '../../shared/components/layout/profile-button/profile-button.component';

@Component({
  selector: 'app-main',
  imports: [
    RouterLink,
    RouterLinkActive,
    NotificationsComponent,
    ProfileButtonComponent,
    RouterOutlet
  ],
  templateUrl: './main.component.html'
})
export default class MainComponent {

  links = [
    {
      name: 'Inicio',
      path: '/app/home',
      icon: 'home',
    },
    {
      name: 'Ánimo',
      path: '/app/mood',
      icon: 'mood',
    },
    {
      name: 'Comunidad',
      path: '/app/community',
      icon: 'diversity_1', // groups
    },
    {
      name: 'Recursos',
      path: '/app/resources',
      icon: 'event_list',
    },
    {
      name: 'Perfil',
      path: '/app/profile',
      icon: 'person',
    }
  ]
}

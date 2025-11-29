import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mood',
  templateUrl: './mood.component.html',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export default class MoodComponent {
  links = [
    {
      name: 'Registrar',
      path: '/app/mood/register',
    },
    {
      name: 'Historial',
      path: '/app/mood/history',
    },
    {
      name: 'Resumen',
      path: '/app/mood/summary',
    },
  ];
}

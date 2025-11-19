import {  Component, input } from '@angular/core';
import { ICONS } from '../icons';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="flex flex-col items-center gap-2">
      <img [src]="ICONS.logo" [alt]="title()" class="w-24 h-24">
      @if (showTitle()) {
        <h1 class="text-xl font-bold">{{ title() }}</h1>
      }
    </div>
  `
})
export class LogoComponent {
  showTitle = input<boolean>(true);
  title = input<string>('KJO Mind Care');
  protected ICONS = ICONS;
}
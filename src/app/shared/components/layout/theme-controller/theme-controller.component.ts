import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-theme-controller',
  imports: [],
  templateUrl: './theme-controller.component.html',
})
export class ThemeControllerComponent {
  private readonly THEME_KEY = 'app-theme';

  isDark = signal<boolean>(false);
  themeName = signal('cosmic-dark');

  constructor() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    // const prefersDark = window.matchMedia(
    //   '(prefers-color-scheme: dark)',
    // ).matches;

    // Determinar el tema inicial
    // if (savedTheme) {
      this.isDark.set(savedTheme === 'dark');
    // } else {
    //   this.isDark.set(prefersDark);
    // }

    // Aplicar el tema inicial
    this.applyTheme();

    // Efecto para aplicar el tema cuando cambie
    effect(() => {
      this.applyTheme();
    });
  }

  toggleTheme() {
    const newTheme = !this.isDark();
    this.isDark.set(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme ? 'dark' : 'light');
  }

  private applyTheme() {
    const theme = this.isDark() ? 'cosmic-dark' : 'cosmic-light';
    this.themeName.set(theme);

    // Aplicar el atributo data-theme al elemento HTML
    document.documentElement.setAttribute('data-theme', theme);
  }
}

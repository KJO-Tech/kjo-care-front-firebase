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
    this.isDark.set(savedTheme === 'dark');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (prefersDark) {
      this.themeName.set('cosmic-light')
    }
  }

  toggleTheme() {
    const newTheme = !this.isDark();
    this.isDark.set(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme ? 'dark' : 'light');
  }

}

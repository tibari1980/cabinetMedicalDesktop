import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeObj = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkModeObj.asObservable();

  constructor() {
    this.initTheme();
  }

  toggleDarkMode() {
    const isDark = !this.isDarkModeObj.value;
    this.isDarkModeObj.next(isDark);
    localStorage.setItem('mc_dark_mode', isDark.toString());
    this.applyTheme(isDark);
  }

  private initTheme() {
    const saved = localStorage.getItem('mc_dark_mode');
    if (saved !== null) {
      const isDark = saved === 'true';
      this.isDarkModeObj.next(isDark);
      this.applyTheme(isDark);
    } else {
      // Vérifier les préférences système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkModeObj.next(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

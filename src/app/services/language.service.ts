import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('fr');
  currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('app_lang') || 'fr';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('app_lang', lang);
    this.currentLangSubject.next(lang);
    // Force document lang update for SEO and A11y
    document.documentElement.lang = lang;
  }

  getCurrentLang(): string {
    return this.currentLangSubject.value;
  }
}

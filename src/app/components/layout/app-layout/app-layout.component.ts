import { Component } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html'
})
export class AppLayoutComponent {
  constructor(public languageService: LanguageService) {}
}

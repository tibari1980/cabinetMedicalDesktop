import { Component, OnInit } from '@angular/core';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'MediFlow';

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Force scroll to top on initial load
    window.scrollTo(0, 0);
  }
}

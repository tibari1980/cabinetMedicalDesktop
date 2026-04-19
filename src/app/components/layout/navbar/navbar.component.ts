import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  today = new Date();
  
  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}
}


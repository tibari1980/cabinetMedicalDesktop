import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  showChangePasswordModal = false;
  newPasswordValue = '';

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  showNotifications() {
    alert("Aucune nouvelle notification pour le moment.");
  }

  openChangePassword() {
    this.newPasswordValue = '';
    this.showChangePasswordModal = true;
  }

  saveNewPassword() {
    if (!this.newPasswordValue || this.newPasswordValue.length < 4) {
      alert("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    const user = this.authService.currentUserValue;
    if (user) {
      this.authService.changePassword(user.id, this.newPasswordValue);
      alert("Mot de passe mis à jour avec succès !");
      this.showChangePasswordModal = false;
    }
  }
}


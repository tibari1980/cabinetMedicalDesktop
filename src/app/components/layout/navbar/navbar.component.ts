import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { User, UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  showChangePasswordModal = false; // We renamed the concept to Profile Modal
  editUser: Partial<User> = {};
  UserRole = UserRole;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  showNotifications() {
    alert("Aucune nouvelle notification pour le moment.");
  }

  openChangePassword() {
    // Clone le user actuel pour l'édition safe
    const user = this.authService.currentUserValue;
    if (user) {
      this.editUser = { ...user };
      this.showChangePasswordModal = true;
    }
  }

  saveProfile() {
    if (!this.editUser.firstName || !this.editUser.lastName) {
      alert("Le nom et le prénom sont obligatoires.");
      return;
    }

    // Si un mot de passe a été saisi, on vérifie la longueur (optionnel si non modifié)
    if (this.editUser.password && this.editUser.password.length < 4) {
      alert("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    this.authService.addOrUpdateUser(this.editUser as User);
    alert("Profil mis à jour avec succès !");
    this.showChangePasswordModal = false;
  }
}


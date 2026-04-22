import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { LanguageService } from '../../../services/language.service';
import { ThemeService } from '../../../services/theme.service';
import { SearchService, SearchResult } from '../../../services/search.service';
import { User, UserRole } from '../../../models/user.model';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  showChangePasswordModal = false; 
  editUser: Partial<User> = {};
  UserRole = UserRole;

  // Search Variables
  searchTerm: string = '';
  showSearchResults: boolean = false;
  results$: Observable<SearchResult[]>;

  languages = [
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'ar', label: 'العربية', flag: 'AR' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'it', label: 'Italiano', flag: 'IT' },
    { code: 'pt', label: 'Português', flag: 'PT' }
  ];
  showLangMenu = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public languageService: LanguageService,
    private searchService: SearchService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    this.results$ = new BehaviorSubject<SearchResult[]>([]).asObservable();
  }

  switchLanguage(lang: string) {
    this.languageService.setLanguage(lang);
    this.showLangMenu = false;
    this.cdr.markForCheck();
  }

  onSearchChange() {
    this.results$ = this.searchService.search(this.searchTerm);
    this.showSearchResults = this.searchTerm.trim().length >= 2;
    this.cdr.markForCheck();
  }

  selectResult(result: SearchResult) {
    this.router.navigateByUrl(result.link);
    this.closeSearch();
  }

  closeSearch() {
    this.searchTerm = '';
    this.showSearchResults = false;
    this.cdr.markForCheck();
  }

  showNotifications() {
    this.notificationService.info("Aucune nouvelle notification pour le moment.", "Notifications");
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
      this.notificationService.error("Le nom et le prénom sont obligatoires.");
      return;
    }

    // Si un mot de passe a été saisi, on vérifie la longueur (optionnel si non modifié)
    if (this.editUser.password && this.editUser.password.length < 4) {
      this.notificationService.error("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    this.authService.addOrUpdateUser(this.editUser as User);
    this.notificationService.success("Profil mis à jour avec succès !");
    this.showChangePasswordModal = false;
  }
}


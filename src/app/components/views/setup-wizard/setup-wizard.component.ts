import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClinicService } from '../../../services/clinic.service';
import { AuthService } from '../../../services/auth.service';
import { LanguageService } from '../../../services/language.service';
import { ClinicInfo } from '../../../models/clinic.model';
import { User, UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-setup-wizard',
  templateUrl: './setup-wizard.component.html',
  styleUrls: ['./setup-wizard.component.css']
})
export class SetupWizardComponent implements OnInit {
  currentStep = 0;
  animating = false;
  slideDirection: 'left' | 'right' = 'left';

  steps = [
    { icon: 'waving_hand', label: 'Bienvenue', sublabel: 'Langue' },
    { icon: 'domain', label: 'Cabinet', sublabel: 'Configuration' },
    { icon: 'admin_panel_settings', label: 'Administrateur', sublabel: 'Compte' },
    { icon: 'rocket_launch', label: 'Confirmation', sublabel: 'Lancer' }
  ];

  selectedLanguage = 'fr';
  languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  clinicInfo: ClinicInfo = {
    name: '', address: '', phone: '', email: '', logo: '',
    version: 'v2.0.0 PRO', openingHour: 8, closingHour: 18,
    country: 'FR', language: 'Français', currency: '€',
    taxTvaRate: 0, legalIds: { siret: '', tva: '' }
  };

  countries = [
    { code: 'FR', name: 'France', currency: '€', languages: ['Français'] },
    { code: 'MA', name: 'Maroc', currency: 'DH', languages: ['العربية', 'Français'] },
    { code: 'ES', name: 'Espagne', currency: '€', languages: ['Español'] },
    { code: 'PT', name: 'Portugal', currency: '€', languages: ['Português'] },
    { code: 'IT', name: 'Italie', currency: '€', languages: ['Italiano'] },
    { code: 'US', name: 'États-Unis', currency: '$', languages: ['English'] },
    { code: 'GB', name: 'Royaume-Uni', currency: '£', languages: ['English'] }
  ];

  admin = {
    firstName: '', lastName: '', username: '',
    password: '', confirmPassword: '', email: '', specialty: ''
  };
  hidePassword = true;
  hideConfirmPassword = true;
  errors: { [key: string]: string } = {};

  constructor(
    private router: Router,
    private clinicService: ClinicService,
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    if (localStorage.getItem('mf_setup_complete')) {
      this.router.navigate(['/login']);
      return;
    }
    this.languageService.setLanguage(this.selectedLanguage);
  }

  onLanguageSelect(langCode: string) {
    this.selectedLanguage = langCode;
    this.languageService.setLanguage(langCode);
  }

  onCountryChange() {
    const selected = this.countries.find(c => c.code === this.clinicInfo.country);
    if (selected) {
      this.clinicInfo.currency = selected.currency;
      if (!this.clinicInfo.language || !selected.languages.includes(this.clinicInfo.language)) {
        this.clinicInfo.language = selected.languages[0];
      }
    }
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.clinicInfo.logo = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  validateStep(step: number): boolean {
    this.errors = {};
    if (step === 1) {
      if (!this.clinicInfo.name?.trim()) this.errors['clinicName'] = 'Le nom du cabinet est requis';
      if (!this.clinicInfo.country) this.errors['country'] = 'Veuillez sélectionner un pays';
    }
    if (step === 2) {
      if (!this.admin.firstName?.trim()) this.errors['firstName'] = 'Le prénom est requis';
      if (!this.admin.lastName?.trim()) this.errors['lastName'] = 'Le nom est requis';
      if (!this.admin.username?.trim()) this.errors['username'] = "L'identifiant est requis";
      else if (this.admin.username.length < 3) this.errors['username'] = "Min. 3 caractères";
      if (!this.admin.password) this.errors['password'] = 'Le mot de passe est requis';
      else if (this.admin.password.length < 6) this.errors['password'] = 'Min. 6 caractères';
      if (this.admin.password !== this.admin.confirmPassword) this.errors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
    }
    return Object.keys(this.errors).length === 0;
  }

  nextStep() {
    if (this.animating) return;
    if (!this.validateStep(this.currentStep)) return;
    this.animating = true;
    this.slideDirection = 'left';
    setTimeout(() => { this.currentStep++; this.animating = false; }, 300);
  }

  prevStep() {
    if (this.animating || this.currentStep === 0) return;
    this.animating = true;
    this.slideDirection = 'right';
    setTimeout(() => { this.currentStep--; this.animating = false; }, 300);
  }

  finishSetup() {
    this.clinicService.updateInfo(this.clinicInfo);
    const adminUser: User = {
      id: crypto.randomUUID(),
      username: this.admin.username.toLowerCase(),
      firstName: this.admin.firstName,
      lastName: this.admin.lastName,
      role: UserRole.SUPER_ADMIN,
      email: this.admin.email || '',
      specialty: this.admin.specialty || '',
      password: this.admin.password,
      phone: ''
    };
    this.authService.createInitialAdmin(adminUser);
    localStorage.setItem('mf_setup_complete', 'true');
    this.router.navigate(['/login']);
  }

  getMaskedPassword(): string {
    return '•'.repeat(this.admin.password.length);
  }
}

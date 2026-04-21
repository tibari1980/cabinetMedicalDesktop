import { Component } from '@angular/core';
import { ClinicService } from '../../../services/clinic.service';
import { AuditService } from '../../../services/audit.service';
import { ClinicInfo } from '../../../models/clinic.model';
import { AuditAction } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  clinicInfo: ClinicInfo = { name: '', openingHour: 8, closingHour: 18 };
  
  countries = [
    { code: 'FR', name: 'France', currency: '€', languages: ['Français'] },
    { code: 'MA', name: 'Maroc', currency: 'DH', languages: ['Français', 'Arabe'] },
    { code: 'ES', name: 'Espagne', currency: '€', languages: ['Espagnol'] },
    { code: 'PT', name: 'Portugal', currency: '€', languages: ['Portugais'] },
    { code: 'IT', name: 'Italie', currency: '€', languages: ['Italien'] },
    { code: 'US', name: 'États-Unis', currency: '$', languages: ['Anglais'] },
    { code: 'GB', name: 'Royaume-Uni', currency: '£', languages: ['Anglais'] }
  ];

  storageUsageMB: number = 0;

  constructor(
    private clinicService: ClinicService,
    private auditService: AuditService,
    private authService: AuthService
  ) {
    this.clinicInfo = { ...this.clinicService.getClinicValue() };
    if (!this.clinicInfo.legalIds) {
      this.clinicInfo.legalIds = {};
    }
    this.storageUsageMB = this.clinicService.getStorageUsageMB();
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

  saveClinicInfo() {
    this.clinicService.updateInfo(this.clinicInfo);
    this.auditService.log(
      this.authService.currentUserValue, 
      AuditAction.EDIT_SETTINGS, 
      `Mise à jour des paramètres système : ${this.clinicInfo.name}`
    );
    alert('Paramètres SaaS enregistrés avec succès !');
    this.storageUsageMB = this.clinicService.getStorageUsageMB();
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.clinicInfo.logo = e.target.result;
        this.saveClinicInfo();
      };
      reader.readAsDataURL(file);
    }
  }
}

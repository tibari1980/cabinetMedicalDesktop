import { Component } from '@angular/core';
import { ClinicService } from '../../../services/clinic.service';
import { AuditService } from '../../../services/audit.service';
import { ClinicInfo } from '../../../models/clinic.model';
import { AuditAction } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  clinicInfo: ClinicInfo = { name: '', openingHour: 8, closingHour: 18 };
  errors: any = {};
  
  countries = [
    { code: 'FR', name: 'France', currency: '€', languages: ['Français'] },
    { code: 'MA', name: 'Maroc', currency: 'DH', languages: ['العربية', 'Français'] },
    { code: 'ES', name: 'Espagne', currency: '€', languages: ['Español'] },
    { code: 'PT', name: 'Portugal', currency: '€', languages: ['Português'] },
    { code: 'IT', name: 'Italie', currency: '€', languages: ['Italiano'] },
    { code: 'US', name: 'États-Unis', currency: '$', languages: ['English'] },
    { code: 'GB', name: 'Royaume-Uni', currency: '£', languages: ['English'] }
  ];

  storageUsageMB: number = 0;

  constructor(
    private clinicService: ClinicService,
    private auditService: AuditService,
    private authService: AuthService,
    private notificationService: NotificationService
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
    this.errors = {};
    if (!this.clinicInfo.name?.trim()) this.errors.name = 'REQUIRED';
    
    if (this.clinicInfo.openingHour >= this.clinicInfo.closingHour) {
      this.errors.hours = 'HOURS_ERROR';
    }

    if (Object.keys(this.errors).length > 0) {
      this.notificationService.error('VALIDATION.REQUIRED');
      return;
    }

    this.clinicService.updateInfo(this.clinicInfo);
    this.auditService.log(
      this.authService.currentUserValue, 
      AuditAction.EDIT_SETTINGS, 
      `Mise à jour des paramètres système : ${this.clinicInfo.name}`
    );
    this.notificationService.success('NOTIFICATIONS.SAVED_SUCCESS');
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

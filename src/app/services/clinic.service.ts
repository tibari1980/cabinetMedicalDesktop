import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicInfo } from '../models/clinic.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  private clinicSubject: BehaviorSubject<ClinicInfo>;
  public clinic$: Observable<ClinicInfo>;

  private defaultInfo: ClinicInfo = {
    name: 'MediFlow Practice',
    address: '',
    phone: '',
    email: '',
    version: 'v2.0.0 PRO',
    logo: 'assets/logo.png',
    openingHour: 8,
    closingHour: 18,
    country: 'FR',
    language: 'Français',
    currency: '€',
    taxTvaRate: 0,
    legalIds: {
      siret: '',
      tva: ''
    }
  };

  constructor() {
    const saved = localStorage.getItem('mf_clinic_info');
    this.clinicSubject = new BehaviorSubject<ClinicInfo>(saved ? JSON.parse(saved) : this.defaultInfo);
    this.clinic$ = this.clinicSubject.asObservable();
  }

  updateInfo(info: ClinicInfo) {
    localStorage.setItem('mf_clinic_info', JSON.stringify(info));
    this.clinicSubject.next(info);
  }

  getClinicValue(): ClinicInfo {
    return this.clinicSubject.value;
  }

  /**
   * Returns true if the clinic has been configured (setup wizard completed).
   */
  isConfigured(): boolean {
    return !!localStorage.getItem('mf_setup_complete');
  }

  /**
   * Marks the initial setup as complete.
   */
  markSetupComplete(): void {
    localStorage.setItem('mf_setup_complete', 'true');
  }

  /**
   * Monitoring Pro : Calcule l'espace utilisé dans le localStorage (Limite ~5MB)
   * Prévient la saturation pour garantir l'évolutivité.
   */
  getStorageUsageMB(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            total += (localStorage.getItem(key)?.length || 0) * 2; // 2 bytes per char (UTF-16)
        }
    }
    return parseFloat((total / 1024 / 1024).toFixed(2));
  }
}

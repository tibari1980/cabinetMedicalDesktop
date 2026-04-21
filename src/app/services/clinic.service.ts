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
    name: 'MedConnect Practice',
    address: 'Av. Mohammed V, Casablanca',
    phone: '+212 522-000000',
    email: 'contact@clinique-test.ma',
    version: 'v1.0.4 PRO',
    logo: '',
    openingHour: 8,
    closingHour: 18,
    country: 'MA',
    language: 'Français',
    currency: 'DH',
    taxTvaRate: 0,
    legalIds: {
      ice: '',
      rc: '',
      patente: '',
      if: ''
    }
  };

  constructor() {
    const saved = localStorage.getItem('mc_clinic_info');
    this.clinicSubject = new BehaviorSubject<ClinicInfo>(saved ? JSON.parse(saved) : this.defaultInfo);
    this.clinic$ = this.clinicSubject.asObservable();
  }

  updateInfo(info: ClinicInfo) {
    localStorage.setItem('mc_clinic_info', JSON.stringify(info));
    this.clinicSubject.next(info);
  }

  getClinicValue(): ClinicInfo {
    return this.clinicSubject.value;
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

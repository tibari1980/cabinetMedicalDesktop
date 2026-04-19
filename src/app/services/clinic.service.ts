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
    closingHour: 18
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
}

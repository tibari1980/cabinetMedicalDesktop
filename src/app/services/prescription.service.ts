import { Injectable } from '@angular/core';
import { Prescription } from '../models/prescription.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private prescriptionsSubject = new BehaviorSubject<Prescription[]>([]);
  public prescriptions$ = this.prescriptionsSubject.asObservable();

  constructor(
    private auditService: AuditService,
    private authService: AuthService
  ) {
    const saved = localStorage.getItem('mf_prescriptions');
    this.prescriptionsSubject.next(saved ? JSON.parse(saved) : []);
  }

  getPrescriptionsByPatientId(patientId: string): Prescription[] {
    return this.prescriptionsSubject.value.filter(p => p.patientId.toString() === patientId.toString());
  }

  getPrescriptionById(id: string): Prescription | undefined {
    return this.prescriptionsSubject.value.find(p => p.id === id);
  }

  addPrescription(prescription: Prescription) {
    const current = this.prescriptionsSubject.value;
    const updated = [prescription, ...current]; // Newest first
    this.saveToLocal(updated);

    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_PRESCRIPTION,
      `Ordonnance générée pour le patient ID: ${prescription.patientId}`
    );
  }

  private saveToLocal(prescriptions: Prescription[]) {
    localStorage.setItem('mf_prescriptions', JSON.stringify(prescriptions));
    this.prescriptionsSubject.next([...prescriptions]);
  }
}

import { Injectable } from '@angular/core';
import { MedicalRecord, Consultation, ConsultationStatus } from '../models/medical-record.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private recordsSubject = new BehaviorSubject<MedicalRecord[]>([]);
  public records$ = this.recordsSubject.asObservable();

  constructor(
    private auditService: AuditService,
    private authService: AuthService
  ) {
    const saved = localStorage.getItem('mc_medical_records');
    this.recordsSubject.next(saved ? JSON.parse(saved) : []);
  }

  getRecordByPatientId(patientId: string): MedicalRecord | undefined {
    return this.recordsSubject.value.find(r => r.patientId.toString() === patientId.toString());
  }

  initializeRecord(patientId: string) {
    const records = this.recordsSubject.value;
    if (!records.find(r => r.patientId.toString() === patientId.toString())) {
      const newRecord: MedicalRecord = {
        patientId,
        allergies: [],
        chronicDiseases: [],
        consultations: [],
        lastUpdate: new Date().toISOString()
      };
      records.push(newRecord);
      this.saveToLocal(records);
    }
  }

  addConsultation(patientId: string, consultation: Consultation) {
    const records = this.recordsSubject.value;
    const recordIndex = records.findIndex(r => r.patientId.toString() === patientId.toString());
    
    if (recordIndex !== -1) {
      records[recordIndex].consultations.unshift(consultation); // Nouvelle en haut
      records[recordIndex].lastUpdate = new Date().toISOString();
      this.saveToLocal(records);

      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.EDIT_SETTINGS, // On n'a pas encore de log spécifique consultation
        `Nouvelle consultation enregistrée pour le patient ID: ${patientId}`
      );
    }
  }

  updateConsultation(patientId: string, consultation: Consultation) {
    const records = this.recordsSubject.value;
    const recordIndex = records.findIndex(r => r.patientId.toString() === patientId.toString());
    
    if (recordIndex !== -1) {
      const consultations = records[recordIndex].consultations;
      const cIndex = consultations.findIndex(c => c.id === consultation.id);
      if (cIndex !== -1) {
        consultations[cIndex] = consultation;
        records[recordIndex].lastUpdate = new Date().toISOString();
        this.saveToLocal(records);
      }
    }
  }

  private saveToLocal(records: MedicalRecord[]) {
    localStorage.setItem('mc_medical_records', JSON.stringify(records));
    this.recordsSubject.next([...records]);
  }
}

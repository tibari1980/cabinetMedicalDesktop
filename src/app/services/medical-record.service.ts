import { Injectable } from '@angular/core';
import { MedicalRecord, Consultation, ConsultationStatus } from '../models/medical-record.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction } from '../models/audit.model';

import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private recordsSubject = new BehaviorSubject<MedicalRecord[]>([]);
  public records$ = this.recordsSubject.asObservable();

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private dbService: DatabaseService
  ) {
    this.loadRecords();
  }

  private async loadRecords() {
    const saved = localStorage.getItem('mc_medical_records');
    let records: MedicalRecord[] = [];
    
    if (saved) {
      records = JSON.parse(saved);
      await this.dbService.putAll('medical_records', records);
      localStorage.removeItem('mc_medical_records');
    } else {
      records = await this.dbService.getAll<MedicalRecord>('medical_records');
    }
    
    this.recordsSubject.next(records);
  }

  getRecordByPatientId(patientId: string): MedicalRecord | undefined {
    return this.recordsSubject.value.find(r => r.patientId.toString() === patientId.toString());
  }

  async initializeRecord(patientId: string) {
    const records = this.recordsSubject.value;
    if (!records.find(r => r.patientId.toString() === patientId.toString())) {
      const newRecord: MedicalRecord = {
        patientId,
        allergies: [],
        chronicDiseases: [],
        consultations: [],
        lastUpdate: new Date().toISOString()
      };
      
      await this.dbService.put('medical_records', newRecord);
      this.recordsSubject.next([...records, newRecord]);
    }
  }

  async addConsultation(patientId: string, consultation: Consultation) {
    const records = this.recordsSubject.value;
    const recordIndex = records.findIndex(r => r.patientId.toString() === patientId.toString());
    
    if (recordIndex !== -1) {
      records[recordIndex].consultations.unshift(consultation); 
      records[recordIndex].lastUpdate = new Date().toISOString();
      
      await this.dbService.put('medical_records', records[recordIndex]);
      this.recordsSubject.next([...records]);

      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.CREATE_CONSULTATION,
        `Nouvelle consultation enregistrée pour le patient ID: ${patientId}`
      );
    }
  }

  async updateConsultation(patientId: string, consultation: Consultation) {
    const records = this.recordsSubject.value;
    const recordIndex = records.findIndex(r => r.patientId.toString() === patientId.toString());
    
    if (recordIndex !== -1) {
      const consultations = records[recordIndex].consultations;
      const cIndex = consultations.findIndex(c => c.id === consultation.id);
      if (cIndex !== -1) {
        consultations[cIndex] = consultation;
        records[recordIndex].lastUpdate = new Date().toISOString();
        
        await this.dbService.put('medical_records', records[recordIndex]);
        this.recordsSubject.next([...records]);
      }
    }
  }
}

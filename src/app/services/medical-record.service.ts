import { Injectable } from '@angular/core';
import { MedicalRecord, Consultation, ConsultationStatus } from '../models/medical-record.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction } from '../models/audit.model';

import { DatabaseService } from './database.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private recordsSubject = new BehaviorSubject<MedicalRecord[]>([]);
  public records$ = this.recordsSubject.asObservable();

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private dbService: DatabaseService,
    private encryptionService: EncryptionService
  ) {
    this.loadRecords();
  }

  private async loadRecords() {
    try {
      const rawRecords = await this.dbService.getAll<any>('medical_records');
      let records: MedicalRecord[] = [];

      for (const item of rawRecords) {
        if (item.encryptedData) {
          const decrypted = await this.encryptionService.decrypt<MedicalRecord>(item.encryptedData);
          if (decrypted) records.push(decrypted);
        } else {
          // Backward compatibility
          records.push(item);
          this.dbService.put('medical_records', { 
            patientId: item.patientId, 
            encryptedData: await this.encryptionService.encrypt(item) 
          });
        }
      }
      
      this.recordsSubject.next(records);
    } catch (error) {
      console.error('Error loading medical records:', error);
      this.recordsSubject.next([]);
    }
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
      
      const encryptedData = await this.encryptionService.encrypt(newRecord);
      await this.dbService.put('medical_records', { patientId, encryptedData });
      this.recordsSubject.next([...records, newRecord]);
    }
  }

  async addConsultation(patientId: string, consultation: Consultation) {
    const records = this.recordsSubject.value;
    const recordIndex = records.findIndex(r => r.patientId.toString() === patientId.toString());
    
    if (recordIndex !== -1) {
      records[recordIndex].consultations.unshift(consultation); 
      records[recordIndex].lastUpdate = new Date().toISOString();
      
      const encryptedData = await this.encryptionService.encrypt(records[recordIndex]);
      await this.dbService.put('medical_records', { patientId, encryptedData });
      this.recordsSubject.next([...records]);
// ... (audit part remains)
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
        
        const encryptedData = await this.encryptionService.encrypt(records[recordIndex]);
        await this.dbService.put('medical_records', { patientId, encryptedData });
        this.recordsSubject.next([...records]);
      }
    }
  }

  async addAllergy(patientId: string, allergy: string) {
    const records = this.recordsSubject.value;
    const rec = records.find(r => r.patientId.toString() === patientId.toString());
    if (rec) {
      if (!rec.allergies.includes(allergy)) {
        rec.allergies.push(allergy);
        rec.lastUpdate = new Date().toISOString();
        const encryptedData = await this.encryptionService.encrypt(rec);
        await this.dbService.put('medical_records', { patientId, encryptedData });
        this.recordsSubject.next([...records]);
        this.auditService.log(this.authService.currentUserValue, AuditAction.EDIT_PATIENT, `Allergie ajoutée : ${allergy} pour patient ID: ${patientId}`);
      }
    }
  }

  async removeAllergy(patientId: string, allergy: string) {
    const records = this.recordsSubject.value;
    const rec = records.find(r => r.patientId.toString() === patientId.toString());
    if (rec) {
      rec.allergies = rec.allergies.filter(a => a !== allergy);
      rec.lastUpdate = new Date().toISOString();
      const encryptedData = await this.encryptionService.encrypt(rec);
      await this.dbService.put('medical_records', { patientId, encryptedData });
      this.recordsSubject.next([...records]);
      this.auditService.log(this.authService.currentUserValue, AuditAction.EDIT_PATIENT, `Allergie supprimée : ${allergy} pour patient ID: ${patientId}`);
    }
  }

  async addChronicDisease(patientId: string, disease: string) {
    const records = this.recordsSubject.value;
    const rec = records.find(r => r.patientId.toString() === patientId.toString());
    if (rec) {
      if (!rec.chronicDiseases.includes(disease)) {
        rec.chronicDiseases.push(disease);
        rec.lastUpdate = new Date().toISOString();
        const encryptedData = await this.encryptionService.encrypt(rec);
        await this.dbService.put('medical_records', { patientId, encryptedData });
        this.recordsSubject.next([...records]);
        this.auditService.log(this.authService.currentUserValue, AuditAction.EDIT_PATIENT, `Pathologie ajoutée : ${disease} pour patient ID: ${patientId}`);
      }
    }
  }

  async removeChronicDisease(patientId: string, disease: string) {
    const records = this.recordsSubject.value;
    const rec = records.find(r => r.patientId.toString() === patientId.toString());
    if (rec) {
      rec.chronicDiseases = rec.chronicDiseases.filter(d => d !== disease);
      rec.lastUpdate = new Date().toISOString();
      const encryptedData = await this.encryptionService.encrypt(rec);
      await this.dbService.put('medical_records', { patientId, encryptedData });
      this.recordsSubject.next([...records]);
      this.auditService.log(this.authService.currentUserValue, AuditAction.EDIT_PATIENT, `Pathologie supprimée : ${disease} pour patient ID: ${patientId}`);
    }
  }
}

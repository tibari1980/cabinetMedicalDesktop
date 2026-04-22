import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';
import { DatabaseService } from './database.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private dataUrl = 'assets/data/patients.json';
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  public patients$ = this.patientsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private auditService: AuditService,
    private dbService: DatabaseService,
    private encryptionService: EncryptionService
  ) {
    this.loadInitialPatients();
  }

  private async loadInitialPatients() {
    try {
      // 1. Try to load from IndexedDB (Scalable storage)
      const rawPatients = await this.dbService.getAll<any>('patients');
      let patients: Patient[] = [];

      for (const item of rawPatients) {
        if (item.encryptedData) {
          const decrypted = await this.encryptionService.decrypt<Patient>(item.encryptedData);
          if (decrypted) patients.push(decrypted);
        } else {
          // Backward compatibility: data is not encrypted yet
          patients.push(item);
          // Upgrade to encrypted on the fly (optional but good)
          this.updatePatient(item);
        }
      }
      
      // 2. Fallback / Migration: If IndexedDB is empty, check localStorage
      if (patients.length === 0) {
        const localPatients = localStorage.getItem('mf_patients');
        if (localPatients) {
          patients = JSON.parse(localPatients);
          // Migrate to IndexedDB with encryption
          for (const p of patients) {
            await this.addPatient(p);
          }
          localStorage.removeItem('mf_patients');
        } else {
          // 3. Last fallback: Load from JSON assets
          this.http.get<Patient[]>(this.dataUrl).pipe(
            catchError(() => {
              console.warn('Impossible de charger patients.json, démarrage avec une liste vide.');
              return of([]);
            })
          ).subscribe(async (jsonPatients) => {
            for (const p of jsonPatients) {
              await this.addPatient(p);
            }
            this.patientsSubject.next(jsonPatients);
          });
          return;
        }
      }
      
      this.patientsSubject.next(patients);
    } catch (error) {
      console.error('Error loading patients:', error);
      this.patientsSubject.next([]);
    }
  }

  getPatients(): Observable<Patient[]> {
    return this.patients$;
  }

  getPatientsValue(): Patient[] {
    return this.patientsSubject.value;
  }

  async addPatient(patient: Patient) {
    if (!patient.id) {
      patient.id = this.dbService.generateSecureId();
    }
    
    // Encrypt for storage
    const encryptedData = await this.encryptionService.encrypt(patient);
    await this.dbService.put('patients', { id: patient.id, encryptedData });
    
    const current = this.patientsSubject.value;
    this.patientsSubject.next([...current, patient]);
    
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_PATIENT,
      `Nouveau patient créé (Sécurisé) : ${patient.firstName} ${patient.lastName}`
    );
  }

  async updatePatient(patient: Patient) {
    const encryptedData = await this.encryptionService.encrypt(patient);
    await this.dbService.put('patients', { id: patient.id, encryptedData });
    
    const current = this.patientsSubject.value;
    const index = current.findIndex(p => p.id === patient.id);
    if (index !== -1) {
      current[index] = patient;
      this.patientsSubject.next([...current]);

      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.EDIT_PATIENT,
        `Mise à jour de la fiche patient : ${patient.firstName} ${patient.lastName}`
      );
    }
  }

  getPatientById(id: number | string): Observable<Patient | undefined> {
    return this.patients$.pipe(
      map(patients => patients.find(p => p.id.toString() === id.toString())),
      tap(patient => {
        if (patient) {
          this.auditService.log(
            this.authService.currentUserValue,
            AuditAction.VIEW_PATIENT,
            `Consultation de la fiche patient : ${patient.firstName} ${patient.lastName}`
          );
        }
      })
    );
  }

  isEmailUnique(email: string, excludeId?: string | number): boolean {
    if (!email) return true;
    const patients = this.getPatientsValue();
    return !patients.some(p => 
      p.email?.toLowerCase() === email.toLowerCase() && p.id.toString() !== excludeId?.toString()
    );
  }
  
  async deletePatient(id: string | number) {
    const patientToDelete = this.getPatientsValue().find(p => p.id.toString() === id.toString());
    
    await this.dbService.delete('patients', id);
    
    const current = this.patientsSubject.value;
    this.patientsSubject.next(current.filter(p => p.id.toString() !== id.toString()));
    
    if (patientToDelete) {
      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.DELETE_PATIENT,
        `Suppression de la fiche patient : ${patientToDelete.firstName} ${patientToDelete.lastName}`
      );
    }
  }
}


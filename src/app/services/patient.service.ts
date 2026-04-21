import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';
import { DatabaseService } from './database.service';

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
    private dbService: DatabaseService
  ) {
    this.loadInitialPatients();
  }

  private async loadInitialPatients() {
    // 1. Try to load from IndexedDB (Scalable storage)
    let patients = await this.dbService.getAll<Patient>('patients');
    
    // 2. Fallback / Migration: If IndexedDB is empty, check localStorage
    if (patients.length === 0) {
      const localPatients = localStorage.getItem('mc_patients');
      if (localPatients) {
        patients = JSON.parse(localPatients);
        // Migrate to IndexedDB
        await this.dbService.putAll('patients', patients);
        // Cleanup old storage
        localStorage.removeItem('mc_patients');
      } else {
        // 3. Last fallback: Load from JSON assets
        this.http.get<Patient[]>(this.dataUrl).pipe(
          catchError(() => {
            console.warn('Impossible de charger patients.json, démarrage avec une liste vide.');
            return of([]);
          })
        ).subscribe(async (jsonPatients) => {
          await this.dbService.putAll('patients', jsonPatients);
          this.patientsSubject.next(jsonPatients);
        });
        return;
      }
    }
    
    this.patientsSubject.next(patients);
  }

  getPatients(): Observable<Patient[]> {
    return this.patients$;
  }

  getPatientsValue(): Patient[] {
    return this.patientsSubject.value;
  }

  async addPatient(patient: Patient) {
    await this.dbService.put('patients', patient);
    const current = this.patientsSubject.value;
    this.patientsSubject.next([...current, patient]);
    
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_PATIENT,
      `Nouveau patient créé : ${patient.firstName} ${patient.lastName}`
    );
  }

  async updatePatient(patient: Patient) {
    await this.dbService.put('patients', patient);
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
}


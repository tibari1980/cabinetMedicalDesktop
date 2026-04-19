import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';

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
    private auditService: AuditService
  ) {
    this.loadInitialPatients();
  }

  private loadInitialPatients() {
    const localPatients = localStorage.getItem('mc_patients');
    if (localPatients) {
      this.patientsSubject.next(JSON.parse(localPatients));
    } else {
      this.http.get<Patient[]>(this.dataUrl).pipe(
        catchError(() => {
          console.warn('Impossible de charger patients.json, démarrage avec une liste vide.');
          return of([]);
        })
      ).subscribe(patients => {
        this.saveToLocal(patients);
      });
    }
  }

  getPatients(): Observable<Patient[]> {
    return this.patients$;
  }

  addPatient(patient: Patient) {
    const current = this.patientsSubject.value;
    const updated = [...current, patient];
    this.saveToLocal(updated);
    
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_PATIENT,
      `Nouveau patient créé : ${patient.firstName} ${patient.lastName}`
    );
  }

  updatePatient(patient: Patient) {
    const current = this.patientsSubject.value;
    const index = current.findIndex(p => p.id === patient.id);
    if (index !== -1) {
      current[index] = patient;
      this.saveToLocal([...current]);

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

  private saveToLocal(patients: Patient[]) {
    localStorage.setItem('mc_patients', JSON.stringify(patients));
    this.patientsSubject.next(patients);
  }
}


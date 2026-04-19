import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../models/patient.model';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private dataUrl = 'assets/data/patients.json';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.dataUrl);
  }

  getPatientById(id: number): Observable<Patient | undefined> {
    return new Observable(observer => {
      this.getPatients().subscribe(patients => {
        const patient = patients.find(p => p.id === id);
        if (patient) {
          this.auditService.log(
            this.authService.currentUserValue, 
            AuditAction.VIEW_PATIENT, 
            `Consultation de la fiche patient : ${patient.firstName} ${patient.lastName}`
          );
        }
        observer.next(patient);
        observer.complete();
      });
    });
  }
}

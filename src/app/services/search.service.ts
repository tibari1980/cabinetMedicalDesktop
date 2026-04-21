import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PatientService } from './patient.service';
import { AppointmentService } from './appointment.service';
import { BillingService } from './billing.service';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'patient' | 'appointment' | 'invoice';
  icon: string;
  link: string;
}

import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private billingService: BillingService,
    private authService: AuthService
  ) {}

  search(query: string): Observable<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return new BehaviorSubject<SearchResult[]>([]).asObservable();
    }

    const q = query.toLowerCase().trim();
    const currentUser = this.authService.currentUserValue;

    return combineLatest([
      this.patientService.patients$,
      this.appointmentService.appointments$,
      this.billingService.invoices$
    ]).pipe(
      map(([patients, appointments, invoices]) => {
        const results: SearchResult[] = [];
        const isSecretary = currentUser?.role === UserRole.SECRETARY;

        // Search Patients
        // NOTE: Secretaries can search patients but maybe shouldn't go to /record directly from search if not allowed
        patients.forEach(p => {
          if (p.firstName.toLowerCase().includes(q) || 
              p.lastName.toLowerCase().includes(q) || 
              p.phone.includes(q)) {
            
            results.push({
              id: p.id.toString(),
              title: `${p.firstName} ${p.lastName}`,
              subtitle: `Patient • ${p.phone}`,
              type: 'patient',
              icon: 'person',
              // Dynamic link: if secretary, go to list or info, if doctor/admin go to record
              link: isSecretary ? '/patients' : `/patients/${p.id}/record`
            });
          }
        });

        // Search Appointments
        appointments.forEach(a => {
          if (a.patientName.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)) {
            results.push({
              id: a.id,
              title: `RDV: ${a.patientName}`,
              subtitle: `${a.type} • ${a.time}`,
              type: 'appointment',
              icon: 'event',
              link: '/calendar'
            });
          }
        });

        // Search Invoices
        // Only show to roles allowed to access billing
        if (this.authService.hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECRETARY])) {
          invoices.forEach(i => {
            if (i.id.toLowerCase().includes(q) || i.patientName.toLowerCase().includes(q)) {
              results.push({
                id: i.id,
                title: `Facture ${i.id}`,
                subtitle: `${i.patientName} • ${i.totalTTC} DH`,
                type: 'invoice',
                icon: 'receipt_long',
                link: '/billing'
              });
            }
          });
        }

        return results.slice(0, 8);
      })
    );
  }
}

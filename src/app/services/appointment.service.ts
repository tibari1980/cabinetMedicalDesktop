import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Appointment, AppointmentStatus, AppointmentType } from '../models/appointment.model';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointmentsSubject: BehaviorSubject<Appointment[]>;
  public appointments$: Observable<Appointment[]>;

  constructor(
    private auditService: AuditService,
    private authService: AuthService
  ) {
    const saved = localStorage.getItem('mf_appointments');
    this.appointmentsSubject = new BehaviorSubject<Appointment[]>(saved ? JSON.parse(saved) : []);
    this.appointments$ = this.appointmentsSubject.asObservable();
  }

  addAppointment(apt: Appointment) {
    const current = this.appointmentsSubject.value;
    const updated = [...current, apt];
    this.saveData(updated);
    
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_APPOINTMENT,
      `Nouveau rendez-vous créé pour ${apt.patientName} le ${apt.date} à ${apt.time}`
    );
  }

  updateAppointment(apt: Appointment) {
    const current = this.appointmentsSubject.value;
    const index = current.findIndex(a => a.id === apt.id);
    if (index !== -1) {
      current[index] = apt;
      this.saveData([...current]);
    }
  }

  getAppointmentsValue(): Appointment[] {
    return this.appointmentsSubject.value;
  }

  getAppointmentsByDate(date: string): Appointment[] {
    return this.appointmentsSubject.value.filter(a => a.date === date);
  }

  private saveData(data: Appointment[]) {
    localStorage.setItem('mf_appointments', JSON.stringify(data));
    this.appointmentsSubject.next(data);
  }
}

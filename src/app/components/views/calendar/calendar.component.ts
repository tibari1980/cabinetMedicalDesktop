import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { PatientService } from '../../../services/patient.service';
import { Appointment, AppointmentType, AppointmentStatus } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { ClinicInfo } from '../../../models/clinic.model';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html'
})
export class CalendarComponent implements OnInit, OnDestroy {
  selectedDate: Date = new Date();
  clinicSettings!: ClinicInfo;
  timeSlots: string[] = [];
  dayAppointments: Appointment[] = [];
  patients: Patient[] = [];
  private subs: Subscription[] = [];

  // Form state
  showModal = false;
  isNewPatient = false;
  
  newApt: Partial<Appointment> = {
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.CONFIRMED,
    duration: 30
  };

  newPatient: Partial<Patient> = {
    gender: 'Masculin'
  };

  constructor(
    private appointmentService: AppointmentService,
    private clinicService: ClinicService,
    private patientService: PatientService,
    private medicalRecordService: MedicalRecordService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const sub1 = this.clinicService.clinic$.subscribe(settings => {
      this.clinicSettings = settings;
      this.generateTimeSlots();
    });

    const sub2 = this.patientService.getPatients().subscribe(p => this.patients = p);
    
    const sub3 = this.appointmentService.appointments$.subscribe(() => {
      this.loadDayAppointments();
    });

    this.subs.push(sub1, sub2, sub3);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  generateTimeSlots() {
    this.timeSlots = [];
    // Only generate slots UNTIL closing hour (not including the last slot starting at closing hour)
    for (let h = this.clinicSettings.openingHour; h < this.clinicSettings.closingHour; h++) {
      this.timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
      this.timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }

  loadDayAppointments() {
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    this.dayAppointments = this.appointmentService.getAppointmentsByDate(dateStr);
  }

  changeDate(days: number) {
    const current = new Date(this.selectedDate);
    current.setDate(current.getDate() + days);
    this.selectedDate = current;
    this.loadDayAppointments();
  }

  resetToToday() {
    this.selectedDate = new Date();
    this.loadDayAppointments();
  }

  getAppointmentsForSlot(slot: string) {
    return this.dayAppointments.filter(a => a.time === slot);
  }

  openNewAptModal(slot?: string) {
    this.newApt = {
      id: Math.random().toString(36).substr(2, 9),
      date: this.selectedDate.toISOString().split('T')[0],
      time: slot || `${this.clinicSettings.openingHour.toString().padStart(2, '0')}:00`,
      duration: 30,
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.CONFIRMED
    };
    this.showModal = true;
  }

  submitAppointment() {
    // Validation des Horaires d'Ouverture
    if (this.newApt.time) {
      const aptHour = parseInt(this.newApt.time.split(':')[0], 10);
      if (aptHour < this.clinicSettings.openingHour || aptHour >= this.clinicSettings.closingHour) {
        this.notificationService.error('NOTIFICATIONS.OUT_OF_HOURS_ERROR', 'SETTINGS.OPENING_HOURS', { open: this.clinicSettings.openingHour, close: this.clinicSettings.closingHour });
        return;
      }
    }

    // Protection Anti-Chevauchement (Logique Experte)
    if (this.newApt.time && this.newApt.date) {
      const sameDayApts = this.appointmentService.getAppointmentsValue()
          .filter(a => a.date === this.newApt.date && a.status !== AppointmentStatus.CANCELLED);
      
      const [newH, newM] = this.newApt.time.split(':').map(Number);
      const newTimeInMin = newH * 60 + newM;

      for (const existing of sameDayApts) {
        if (!existing.time) continue;
        const [exH, exM] = existing.time.split(':').map(Number);
        const exTimeInMin = exH * 60 + exM;

        if (Math.abs(newTimeInMin - exTimeInMin) < 15) {
          this.notificationService.warning('NOTIFICATIONS.COLLISION_ERROR', 'CALENDAR.MODAL_TITLE');
          return;
        }
      }
    }

    if (this.isNewPatient) {
      const patientId = Date.now();
      const patient: Patient = {
        id: patientId,
        firstName: this.newPatient.firstName || '',
        lastName: this.newPatient.lastName || '',
        phone: this.newPatient.phone || '',
        birthDate: this.newPatient.birthDate || '',
        address: this.newPatient.address || '',
        gender: this.newPatient.gender || 'Masculin',
        email: '',
        lastVisit: new Date().toISOString()
      };
      
      this.patientService.addPatient(patient);
      this.medicalRecordService.initializeRecord(patientId.toString());
      
      this.newApt.patientId = patientId.toString();
      this.newApt.patientName = `${patient.firstName} ${patient.lastName}`;
    } else {
      const patient = this.patients.find(p => p.id.toString() === this.newApt.patientId?.toString());
      this.newApt.patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'PATIENTS.PATIENT_UNKNOWN';
    }

    if (this.newApt.patientId) {
      this.appointmentService.addAppointment(this.newApt as Appointment);
      this.showModal = false;
      this.isNewPatient = false;
      this.newPatient = { gender: 'Masculin' };
    }
  }

  printAgenda() {
    window.print();
  }

  updateAptStatus(apt: Appointment, status: string, event: Event) {
    event.stopPropagation(); // Avoid triggering openNewAptModal or whatever
    apt.status = status as AppointmentStatus;
    this.appointmentService.updateAppointment(apt);
    this.showModal = false; // Close just in case
  }

  trackBySlot(index: number, slot: string): string {
    return slot;
  }

  trackByAppointment(index: number, apt: Appointment): string {
    return apt.id.toString();
  }

  trackByPatient(index: number, patient: Patient): string {
    return patient.id.toString();
  }
}

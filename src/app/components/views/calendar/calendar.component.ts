import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { PatientService } from '../../../services/patient.service';
import { Appointment, AppointmentType, AppointmentStatus } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { ClinicInfo } from '../../../models/clinic.model';

import { MedicalRecordService } from '../../../services/medical-record.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html'
})
export class CalendarComponent implements OnInit {
  selectedDate: Date = new Date();
  clinicSettings!: ClinicInfo;
  timeSlots: string[] = [];
  dayAppointments: Appointment[] = [];
  patients: Patient[] = [];

  // Form state
  showModal = false;
  isNewPatient = false;
  
  newApt: Partial<Appointment> = {
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.CONFIRMED,
    duration: 30
  };

  newPatient: Partial<Patient> = {
    gender: 'M'
  };

  constructor(
    private appointmentService: AppointmentService,
    private clinicService: ClinicService,
    private patientService: PatientService,
    private medicalRecordService: MedicalRecordService
  ) {}

  ngOnInit() {
    this.clinicService.clinic$.subscribe(settings => {
      this.clinicSettings = settings;
      this.generateTimeSlots();
    });

    this.patientService.getPatients().subscribe(p => this.patients = p);
    
    this.appointmentService.appointments$.subscribe(() => {
      this.loadDayAppointments();
    });
  }

  generateTimeSlots() {
    this.timeSlots = [];
    for (let h = this.clinicSettings.openingHour; h <= this.clinicSettings.closingHour; h++) {
      this.timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
      this.timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }

  loadDayAppointments() {
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    this.dayAppointments = this.appointmentService.getAppointmentsByDate(dateStr);
  }

  changeDate(days: number) {
    this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + days));
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
      time: slot || '09:00',
      duration: 30,
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.CONFIRMED
    };
    this.showModal = true;
  }

  submitAppointment() {
    if (this.isNewPatient) {
      // Create New Patient first
      const patientId = Math.floor(Math.random() * 10000);
      const patient: Patient = {
        id: patientId,
        firstName: this.newPatient.firstName || '',
        lastName: this.newPatient.lastName || '',
        phone: this.newPatient.phone || '',
        birthDate: this.newPatient.birthDate || '',
        address: this.newPatient.address || '',
        gender: this.newPatient.gender || 'M',
        email: '',
        lastVisit: 'Aujourd\'hui'
      };
      
      this.patientService.addPatient(patient);
      this.medicalRecordService.initializeRecord(patientId.toString());
      
      this.newApt.patientId = patientId.toString();
      this.newApt.patientName = `${patient.firstName} ${patient.lastName}`;
    } else {
      const patient = this.patients.find(p => p.id.toString() === this.newApt.patientId?.toString());
      this.newApt.patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu';
    }

    if (this.newApt.patientId) {
      this.appointmentService.addAppointment(this.newApt as Appointment);
      this.showModal = false;
      this.isNewPatient = false;
      this.newPatient = { gender: 'M' };
    }
  }

  printAgenda() {
    window.print();
  }
}

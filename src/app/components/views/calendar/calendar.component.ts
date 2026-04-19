import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { PatientService } from '../../../services/patient.service';
import { Appointment, AppointmentType, AppointmentStatus } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { ClinicInfo } from '../../../models/clinic.model';

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
  newApt: Partial<Appointment> = {
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.CONFIRMED,
    duration: 30
  };

  constructor(
    private appointmentService: AppointmentService,
    private clinicService: ClinicService,
    private patientService: PatientService
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
    if (this.newApt.patientId) {
      const patient = this.patients.find(p => p.id.toString() === this.newApt.patientId?.toString());
      this.newApt.patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu';
      this.appointmentService.addAppointment(this.newApt as Appointment);
      this.showModal = false;
    }
  }

  printAgenda() {
    window.print();
  }
}

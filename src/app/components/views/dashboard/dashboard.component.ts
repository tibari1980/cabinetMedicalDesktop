import { Component, OnInit, OnDestroy } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { Appointment, AppointmentType, AppointmentStatus } from '../../../models/appointment.model';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  today = new Date();
  private subs: Subscription[] = [];

  // Stats
  totalPatients = 0;
  revenueToday = 0;
  pendingCount = 0;
  occupationRate = 0;
  waitingList: Appointment[] = [];

  // Booking Modal
  showModal = false;
  isNewPatient = false;
  newApt: Partial<Appointment> = {};
  newPatient: Partial<Patient> = { gender: 'Masculin' };

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private medicalRecordService: MedicalRecordService,
    private clinicService: ClinicService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const todayStr = this.today.toISOString().split('T')[0];

    const sub1 = this.patientService.getPatients().subscribe(data => {
      this.patients = data;
      this.totalPatients = data.length;
    });

    const sub2 = this.appointmentService.appointments$.subscribe(allApts => {
      const apts = allApts.filter(a => a.date === todayStr);
      this.pendingCount = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.WAITING).length;
      this.waitingList = apts.filter(a => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.DONE);
      this.revenueToday = apts.reduce((sum, a) => sum + (a.fee || 0), 0);
      this.calculateOccupation(apts);
    });

    this.subs.push(sub1, sub2);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private calculateOccupation(todayApts: Appointment[]) {
    const clinic = this.clinicService.getClinicValue();
    const totalSlots = (clinic.closingHour - clinic.openingHour) * 2; // 30-min slots
    const bookedSlots = todayApts.filter(a => a.status !== AppointmentStatus.CANCELLED).length;
    this.occupationRate = totalSlots > 0 ? Math.min(Math.round((bookedSlots / totalSlots) * 100), 100) : 0;
  }

  openBookingModal() {
    this.newApt = {
      id: Math.random().toString(36).substr(2, 9),
      date: this.today.toISOString().split('T')[0],
      time: '09:00',
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.CONFIRMED,
      duration: 30,
      fee: 300
    };
    this.isNewPatient = false;
    this.newPatient = { gender: 'Masculin' };
    this.showModal = true;
  }

  submitAppointment() {
    if (this.isNewPatient) {
      if (!this.newPatient.firstName || !this.newPatient.lastName || !this.newPatient.phone) {
        alert('Veuillez remplir le nom, prénom et téléphone du patient.');
        return;
      }
      const patientId = Date.now();
      const patient: Patient = {
        id: patientId,
        firstName: this.newPatient.firstName,
        lastName: this.newPatient.lastName,
        phone: this.newPatient.phone,
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
      if (!this.newApt.patientId) {
        alert('Veuillez sélectionner un patient.');
        return;
      }
      const patient = this.patients.find(p => p.id.toString() === this.newApt.patientId?.toString());
      this.newApt.patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu';
    }

    this.appointmentService.addAppointment(this.newApt as Appointment);
    this.showModal = false;
  }

  updateAptStatus(apt: Appointment, status: string) {
    apt.status = status as AppointmentStatus;
    this.appointmentService.updateAppointment(apt);
  }

  trackByApt(index: number, apt: Appointment): string {
    return apt.id.toString();
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id.toString();
  }
}


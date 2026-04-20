import { Component, OnInit, OnDestroy } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { StatisticsService } from '../../../services/statistics.service';
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
  revenueWeek = 0;
  patientGrowth = 0;
  pendingCount = 0;
  occupationRate = 0;
  waitingList: Appointment[] = [];

  // Booking Modal
  showModal = false;
  isNewPatient = false;
  bookingStatus: 'idle' | 'saving' | 'success' = 'idle';
  patientSearchTerm = '';
  newApt: Partial<Appointment> = {};
  newPatient: Partial<Patient> = { gender: 'Masculin' };

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private medicalRecordService: MedicalRecordService,
    private clinicService: ClinicService,
    private statsService: StatisticsService,
    public authService: AuthService
  ) {}

  get filteredPatients(): Patient[] {
    if (!this.patientSearchTerm) return this.patients;
    const term = this.patientSearchTerm.toLowerCase();
    return this.patients.filter(p => 
      p.firstName.toLowerCase().includes(term) || 
      p.lastName.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  }

  ngOnInit() {
    const todayStr = this.today.toISOString().split('T')[0];

    const sub1 = this.patientService.getPatients().subscribe(data => {
      this.patients = data;
      this.totalPatients = data.length;
    });

    const sub2 = this.appointmentService.appointments$.subscribe(allApts => {
      const todayStr = this.today.toISOString().split('T')[0];
      const apts = allApts.filter(a => a.date === todayStr);
      
      this.pendingCount = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.WAITING).length;
      this.waitingList = apts.filter(a => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.DONE);
      this.revenueToday = apts.reduce((sum, a) => sum + (a.fee || 0), 0);
      
      this.calculateOccupation(apts);
    });

    const sub3 = this.statsService.getPerformanceStats().subscribe(stats => {
      this.revenueWeek = stats.totalRevenue; // Synchronized from StatisticsService
    });

    this.subs.push(sub1, sub2, sub3);
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
    this.bookingStatus = 'idle';
    this.patientSearchTerm = '';
  }

  onTypeChange() {
    // Expert Logic: Propose default fees based on type
    if (this.newApt.type === AppointmentType.EMERGENCY) this.newApt.fee = 500;
    else if (this.newApt.type === AppointmentType.CONTROL) this.newApt.fee = 150;
    else this.newApt.fee = 300;
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

    this.bookingStatus = 'saving';

    // Simulate small delay for "Wooow" effect and robustness
    setTimeout(() => {
      this.appointmentService.addAppointment(this.newApt as Appointment);
      this.bookingStatus = 'success';
      
      // Close after success animation
      setTimeout(() => {
        this.showModal = false;
        this.bookingStatus = 'idle';
      }, 1500);
    }, 600);
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


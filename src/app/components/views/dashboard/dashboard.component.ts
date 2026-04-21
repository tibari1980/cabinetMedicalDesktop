import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ClinicService } from '../../../services/clinic.service';
import { StatisticsService } from '../../../services/statistics.service';
import { Appointment, AppointmentType, AppointmentStatus } from '../../../models/appointment.model';
import { UserRole } from '../../../models/user.model';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { BillingService } from '../../../services/billing.service';
import { AuditService } from '../../../services/audit.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  computedFilteredPatients: Patient[] = [];
  clinic: any;
  minTime: string = '08:00';
  maxTime: string = '18:00';
  today = new Date();
  private destroy$ = new Subject<void>();

  // Stats
  totalPatients = 0;
  revenueToday = 0;
  revenueWeek = 0;
  patientGrowth = 0;
  pendingCount = 0;
  occupationRate = 0;
  // Files
  recentLogs: any[] = [];
  UserRole = UserRole;

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private medicalRecordService: MedicalRecordService,
    private clinicService: ClinicService,
    private statsService: StatisticsService,
    private billingService: BillingService,
    private auditService: AuditService,
    private router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onPatientSearchTermChange(term: string) {
    this.patientSearchTerm = term;
    if (!this.patientSearchTerm) {
      this.computedFilteredPatients = this.patients;
      return;
    }
    const txt = this.patientSearchTerm.toLowerCase();
    this.computedFilteredPatients = this.patients.filter(p => 
      p.firstName.toLowerCase().includes(txt) || 
      p.lastName.toLowerCase().includes(txt) ||
      p.phone.includes(txt)
    );
  }

  ngOnInit() {
    this.clinicService.clinic$
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => {
        this.clinic = c;
        const open = c.openingHour;
        const close = c.closingHour;
        this.minTime = (open < 10 ? '0' + open : open) + ':00';
        this.maxTime = (close < 10 ? '0' + close : close) + ':00';
        this.cdr.markForCheck();
      });

    this.patientService.getPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.patients = data;
        this.totalPatients = data.length;
        this.onPatientSearchTermChange(this.patientSearchTerm);
        this.cdr.markForCheck();
      });

    this.appointmentService.appointments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(allApts => {
        const todayStr = this.today.toISOString().split('T')[0];
        const apts = allApts.filter(a => {
          if (a.date !== todayStr || !a.time) return false;
          const hour = parseInt(a.time.split(':')[0], 10);
          return hour >= (this.clinic?.openingHour || 8) && hour < (this.clinic?.closingHour || 18);
        });
        
        this.pendingCount = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.WAITING).length;
        this.waitingList = apts.filter(a => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.DONE);
        this.revenueToday = apts.reduce((sum, a) => sum + (a.fee || 0), 0);
        
        this.calculateOccupation(apts);
        this.cdr.markForCheck();
      });

    this.statsService.getPerformanceStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.revenueWeek = stats.totalRevenue;
        this.cdr.markForCheck();
      });

    this.auditService.logs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.recentLogs = logs.slice(0, 5);
        this.cdr.markForCheck();
      });
  }

  // Restore variables potentially cleared by previous edit
  waitingList: Appointment[] = [];
  showModal = false;
  isNewPatient = false;
  bookingStatus: 'idle' | 'saving' | 'success' = 'idle';
  patientSearchTerm = '';
  newApt: Partial<Appointment> = {};
  newPatient: Partial<Patient> = { gender: 'Masculin' };
  appointmentTypes = Object.values(AppointmentType);

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateOccupation(todayApts: Appointment[]) {
    const clinic = this.clinicService.getClinicValue();
    const totalSlots = (clinic.closingHour - clinic.openingHour) * 2; // 30-min slots
    const bookedSlots = todayApts.filter(a => a.status !== AppointmentStatus.CANCELLED).length;
    this.occupationRate = totalSlots > 0 ? Math.min(Math.round((bookedSlots / totalSlots) * 100), 100) : 0;
  }

  openBookingModal() {
    const openHour = this.clinic?.openingHour || 8;
    this.newApt = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: '',
      date: this.today.toISOString().split('T')[0],
      time: (openHour < 10 ? '0' + openHour : openHour) + ':00',
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
    else if (this.newApt.type === AppointmentType.FOLLOW_UP) this.newApt.fee = 150;
    else this.newApt.fee = 300;
  }

  submitAppointment() {
    if (this.newApt.time) {
      const aptHour = parseInt(this.newApt.time.split(':')[0], 10);
      const clinic = this.clinic;
      if (aptHour < clinic.openingHour || aptHour >= clinic.closingHour) {
        alert(`Attention: Les rendez-vous ne sont permis que pendant les horaires d\'ouverture du cabinet (${clinic.openingHour}h00 - ${clinic.closingHour}h00).`);
        return;
      }

      // Anti-Overlap Logic: 15 minutes strict spacing minimal
      const [newH, newM] = this.newApt.time.split(':').map(Number);
      const newTimeInMin = newH * 60 + newM;
      
      const sameDayApts = this.appointmentService.getAppointmentsValue().filter(a => a.date === this.newApt.date && a.status !== AppointmentStatus.CANCELLED);
      for (const existing of sameDayApts) {
        if (!existing.time) continue;
        const [exH, exM] = existing.time.split(':').map(Number);
        const exTimeInMin = exH * 60 + exM;
        
        if (Math.abs(newTimeInMin - exTimeInMin) < 15) {
          alert(`PROTECTION AGENDA : Le créneau ${this.newApt.time} est trop proche du rendez-vous déjà prévu à ${existing.time}. Veuillez espacer d'au moins 15 minutes.`);
          return;
        }
      }
    }

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
    // Rend le prix obligatoire à la "Fin" de consultation
    if (status === 'Terminé' && (!apt.fee || apt.fee <= 0)) {
       const input = prompt(`Fin de consultation. Veuillez saisir le montant total à régler par ${apt.patientName} (en ${this.clinic.currency || 'DH'}) :`);
       if (input === null || input.trim() === '') {
         alert("Action annulée : Le montant de la consultation est obligatoire !");
         return;
       }
       const fee = parseFloat(input);
       if (isNaN(fee) || fee <= 0) {
         alert("Action annulée : Le montant saisi est invalide.");
         return;
       }
       apt.fee = fee;
    }

    apt.status = status as AppointmentStatus;
    this.appointmentService.updateAppointment(apt);
  }

  generateInvoice(apt: Appointment) {
    // Vérification de sécurité experte : Personne n'a le droit de facturer avant la clôture officielle
    if (apt.status !== 'Terminé') {
        alert("Protection Métier : La facture ne peut être générée que si la consultation est clôturée (Terminée).");
        return;
    }

    // Si la facture est demandée mais que le prix n'a pas encore été renseigné
    if (!apt.fee || apt.fee <= 0) {
       const input = prompt(`Veuillez définir le montant de la prestation pour générer la facture de ${apt.patientName} (en ${this.clinic.currency || 'DH'}) :`);
       if (input === null || input.trim() === '') {
         alert("La facturation a été annulée car le prix est obligatoire.");
         return;
       }
       const fee = parseFloat(input);
       if (isNaN(fee) || fee <= 0) {
           alert("Montant saisi invalide.");
           return;
       }
       apt.fee = fee;
       this.appointmentService.updateAppointment(apt);
    }

    if(confirm(`Voulez-vous générer une facture pour ${apt.patientName} d'un montant de ${apt.fee} ${this.clinic.currency || 'DH'} ?`)) {
      this.billingService.generateInvoiceFromAppointment(apt);
      this.router.navigate(['/billing']);
    }
  }

  trackByApt(index: number, apt: Appointment): string {
    return apt.id.toString();
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id.toString();
  }
}


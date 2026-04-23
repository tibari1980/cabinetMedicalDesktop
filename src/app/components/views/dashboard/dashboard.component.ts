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
import { NotificationService } from '../../../services/notification.service';
import { DialogService } from '../../../services/dialog.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {}

  onPatientSearchTermChange(term: string) {
    this.patientSearchTerm = term;
    if (!this.patientSearchTerm) {
      this.computedFilteredPatients = this.patients;
      this.cdr.markForCheck();
      return;
    }
    const txt = this.patientSearchTerm.toLowerCase();
    this.computedFilteredPatients = this.patients.filter(p => 
      p.firstName.toLowerCase().includes(txt) || 
      p.lastName.toLowerCase().includes(txt) ||
      p.phone.includes(txt)
    );
    this.cdr.markForCheck();
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
  errors: any = {};

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
    this.errors = {};
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
        this.notificationService.error('NOTIFICATIONS.OUT_OF_HOURS_ERROR', 'SETTINGS.OPENING_HOURS', { open: clinic.openingHour, close: clinic.closingHour });
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
          this.notificationService.warning('NOTIFICATIONS.COLLISION_ERROR', 'CALENDAR.MODAL_TITLE');
          return;
        }
      }
    }

    if (this.bookingStatus !== 'idle') return;
    
    if (this.isNewPatient) {
      this.errors = {};
      if (!this.newPatient.firstName?.trim()) this.errors.firstName = true;
      if (!this.newPatient.lastName?.trim()) this.errors.lastName = true;
      if (!this.newPatient.phone?.trim()) this.errors.phone = true;
      
      if (this.newPatient.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.newPatient.email)) {
          this.errors.emailFormat = true;
        } else if (!this.patientService.isEmailUnique(this.newPatient.email)) {
          this.errors.emailTaken = true;
        }
      }

      const patientFields = [
        { key: 'firstName', label: 'COMMON.FIRST_NAME' },
        { key: 'lastName', label: 'COMMON.LAST_NAME' },
        { key: 'phone', label: 'SETUP.PHONE' }
      ];

      if (Object.keys(this.errors).length > 0) {
        if (this.errors.emailFormat) {
          this.notificationService.error('VALIDATION.INVALID_EMAIL');
        } else if (this.errors.emailTaken) {
          this.notificationService.error('VALIDATION.EMAIL_TAKEN');
        } else {
          const firstMissingField = patientFields.find(f => this.errors[f.key]);
          if (firstMissingField) {
            this.notificationService.showRequiredFieldError(firstMissingField.label);
          } else {
            this.notificationService.error('VALIDATION.FORM_ERRORS');
          }
        }
        this.cdr.markForCheck();
        return;
      }

      const patientId = Date.now();
      const patient: Patient = {
        id: patientId,
        firstName: (this.newPatient.firstName || '').trim(),
        lastName: (this.newPatient.lastName || '').trim(),
        phone: (this.newPatient.phone || '').trim(),
        birthDate: this.newPatient.birthDate || '',
        address: (this.newPatient.address || '').trim(),
        gender: this.newPatient.gender || 'Masculin',
        email: (this.newPatient.email || '').trim(),
        lastVisit: new Date().toISOString()
      };

      this.patientService.addPatient(patient);
      this.medicalRecordService.initializeRecord(patientId.toString());
      this.newApt.patientId = patientId.toString();
      this.newApt.patientName = `${patient.firstName} ${patient.lastName}`;
    } else {
      if (!this.newApt.patientId) {
        this.notificationService.error('NOTIFICATIONS.SELECT_PATIENT_ERROR');
        return;
      }
      const patient = this.patients.find(p => p.id.toString() === this.newApt.patientId?.toString());
      this.newApt.patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu';
    }

    this.bookingStatus = 'saving';
    this.cdr.markForCheck();

    // Simulate small delay for "Wooow" effect and robustness
    setTimeout(() => {
      this.appointmentService.addAppointment(this.newApt as Appointment);
      this.bookingStatus = 'success';
      this.cdr.markForCheck();
    }, 600);
  }

  async updateAptStatus(apt: Appointment, status: string) {
    if (status === 'Annulé') {
      const confirmed = await this.dialogService.confirm({
        title: 'CALENDAR.STATUS_CANCELLED',
        message: 'NOTIFICATIONS.CONFIRM_CANCEL_APT',
        type: 'danger',
        confirmLabel: 'COMMON.DELETE',
        params: { name: apt.patientName }
      });
      if (!confirmed) return;
    }

    if (status === 'Terminé') {
      const result = await this.dialogService.confirm({
        title: 'CALENDAR.STATUS_DONE',
        message: 'NOTIFICATIONS.CONFIRM_FINISH_APT',
        type: 'success',
        confirmLabel: 'COMMON.VALIDATE',
        params: { name: apt.patientName },
        showInput: true,
        inputValue: apt.fee || 300,
        inputPlaceholder: '300'
      });
      
      if (!result.confirmed) return;
      
      if (result.value) {
        apt.fee = Number(result.value);
      }

      // Automatisme Premium : Proposer la facturation immédiatement après la clôture
      setTimeout(() => {
        this.generateInvoice(apt);
      }, 500);
    }

    apt.status = status as AppointmentStatus;
    this.appointmentService.updateAppointment(apt);
  }

  generateInvoice(apt: Appointment) {
    // Vérification de sécurité experte : Personne n'a le droit de facturer avant la clôture officielle
    if (apt.status !== 'Terminé') {
        this.notificationService.warning("NOTIFICATIONS.UNAUTHORIZED", 'BILLING.DOC_TITLE');
        return;
    }

    // Si la facture est demandée mais que le prix n'a pas encore été renseigné
    if (!apt.fee || apt.fee <= 0) {
       apt.fee = 300;
       this.appointmentService.updateAppointment(apt);
    }

    this.dialogService.confirm({
      title: 'BILLING.DOC_TITLE',
      message: 'NOTIFICATIONS.GENERATE_INVOICE_CONFIRM',
      type: 'primary',
      confirmLabel: 'COMMON.VALIDATE',
      params: { 
        name: apt.patientName, 
        amount: apt.fee, 
        currency: this.clinic.currency || 'DH' 
      }
    }).then(confirmed => {
      if (confirmed) {
        this.billingService.generateInvoiceFromAppointment(apt);
        this.router.navigate(['/billing']);
        this.cdr.markForCheck();
      }
    });
  }

  trackByApt(index: number, apt: Appointment): string {
    return apt.id.toString();
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id.toString();
  }

  printAppointment() {
    window.print();
  }

  async downloadAppointmentPDF() {
    const data = document.getElementById('appointment-ticket');
    if (!data) {
      this.notificationService.error('COMMON.ERROR');
      return;
    }

    try {
      this.notificationService.info('Calcul du rendu PDF...');
      
      const canvas = await html2canvas(data, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `RDV-${(this.newApt.patientName || 'Patient').replace(/\s+/g, '_')}-${this.newApt.date}.pdf`;
      pdf.save(fileName);
      
      this.notificationService.success('NOTIFICATIONS.SAVED_SUCCESS');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      this.notificationService.error('COMMON.ERROR');
    }
  }

  closeModalAndReset() {
    this.showModal = false;
    this.bookingStatus = 'idle';
    // Reset form
    this.newApt = {
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      type: AppointmentType.CONSULTATION,
      fee: 0,
      patientId: ''
    };
    this.isNewPatient = false;
    this.cdr.markForCheck();
  }

  quickPrint(apt: Appointment) {
    this.newApt = { ...apt };
    this.cdr.detectChanges(); // Force update to fill the hidden ticket
    setTimeout(() => {
      this.printAppointment();
    }, 100);
  }

  quickPDF(apt: Appointment) {
    this.newApt = { ...apt };
    this.cdr.detectChanges(); // Force update to fill the hidden ticket
    setTimeout(() => {
      this.downloadAppointmentPDF();
    }, 100);
  }
}


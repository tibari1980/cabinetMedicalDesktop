import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Patient } from '../../../models/patient.model';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';
import { DialogService } from '../../../services/dialog.service';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm = '';
  private destroy$ = new Subject<void>();

  // Modal state
  showModal = false;
  isEditMode = false;
  newPatient: Partial<Patient> = { gender: 'Masculin' };
  
  UserRole = UserRole;

  constructor(
    private patientService: PatientService,
    private medicalRecordService: MedicalRecordService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    public authService: AuthService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.patientService.getPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.patients = data;
        this.applyFilter();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPatients = this.patients;
      this.currentPage = 1;
      this.recomputePagination();
      this.cdr.markForCheck();
      return;
    }
    this.filteredPatients = this.patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.recomputePagination();
    this.cdr.markForCheck();
  }

  openNewPatientModal() {
    this.isEditMode = false;
    this.newPatient = { gender: 'Masculin' };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEditPatientModal(patient: Patient) {
    this.isEditMode = true;
    this.newPatient = { ...patient };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  errors: any = {};

  submitNewPatient() {
    this.errors = {};
    // Field validations
    if (!this.newPatient.lastName?.trim()) {
      this.errors.lastName = 'REQUIRED';
    } else if (this.newPatient.lastName.trim().length < 2) {
      this.errors.lastName = 'MIN';
    }

    if (!this.newPatient.firstName?.trim()) {
      this.errors.firstName = 'REQUIRED';
    } else if (this.newPatient.firstName.trim().length < 2) {
      this.errors.firstName = 'MIN';
    }

    if (!this.newPatient.phone?.trim()) {
      this.errors.phone = 'REQUIRED';
    }

    if (!this.newPatient.birthDate) {
      this.errors.birthDate = 'REQUIRED';
    } else {
      const bdate = new Date(this.newPatient.birthDate);
      if (bdate > new Date()) {
        this.errors.birthDate = 'FUTURE';
      }
    }

    if (!this.newPatient.address?.trim()) {
      this.errors.address = 'REQUIRED';
    } else if (this.newPatient.address.trim().length < 10) {
      this.errors.address = 'MIN';
    }
    
    // Email Validation (Format + Uniqueness)
    if (this.newPatient.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.newPatient.email)) {
        this.errors.emailFormat = true;
      } else if (!this.patientService.isEmailUnique(this.newPatient.email, this.newPatient.id)) {
        this.errors.emailTaken = true;
      }
    }

    if (Object.keys(this.errors).length > 0) {
      if (this.errors.emailTaken) {
        this.notificationService.error('VALIDATION.EMAIL_TAKEN');
      } else {
        this.notificationService.error('COMMON.ERROR');
      }
      this.cdr.markForCheck();
      return;
    }

    if (this.isEditMode && this.newPatient.id) {
      const patient: Patient = {
        ...this.newPatient as Patient,
        firstName: (this.newPatient.firstName || '').trim(),
        lastName: (this.newPatient.lastName || '').trim(),
        phone: (this.newPatient.phone || '').trim(),
        address: (this.newPatient.address || '').trim()
      };
      this.patientService.updatePatient(patient);
      this.notificationService.success('NOTIFICATIONS.PROFILE_SAVED');
    } else {
      const patientId = Date.now();
      const patient: Patient = {
        id: patientId,
        firstName: (this.newPatient.firstName || '').trim(),
        lastName: (this.newPatient.lastName || '').trim(),
        phone: (this.newPatient.phone || '').trim(),
        birthDate: this.newPatient.birthDate!,
        address: (this.newPatient.address || '').trim(),
        gender: this.newPatient.gender || 'Masculin',
        email: (this.newPatient.email || '').trim(),
        lastVisit: new Date().toISOString()
      };

      this.patientService.addPatient(patient);
      this.medicalRecordService.initializeRecord(patientId.toString());
      this.notificationService.success('NOTIFICATIONS.PATIENT_CREATED');
    }

    this.showModal = false;
    this.newPatient = { gender: 'Masculin' };
    this.errors = {};
    this.cdr.markForCheck();
  }

  // Pagination logic
  currentPage = 1;
  itemsPerPage = 10;
  computedPaginatedPatients: Patient[] = [];
  computedTotalPages = 1;

  private recomputePagination() {
    this.computedTotalPages = Math.ceil(this.filteredPatients.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.computedTotalPages) {
      this.currentPage = this.computedTotalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.computedPaginatedPatients = this.filteredPatients.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.computedTotalPages) {
      this.currentPage = newPage;
      this.recomputePagination();
      this.cdr.markForCheck();
    }
  }

  exportPatientsCSV() {
    const headers = ['ID', 'Nom', 'Prenom', 'Telephone', 'Email', 'Genre', 'Date_Naissance', 'Derniere_Visite'];
    const rows = this.patients.map(p => [
      p.id, 
      `"${p.lastName}"`, 
      `"${p.firstName}"`, 
      `"${p.phone}"`, 
      `"${p.email || ''}"`, 
      `"${p.gender}"`, 
      `"${p.birthDate}"`, 
      `"${p.lastVisit}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  trackByPatient(index: number, patient: Patient): string {
    return patient.id.toString();
  }

  async deletePatient(id: string | number, name: string) {
    const confirmed = await this.dialogService.confirm({
      title: 'COMMON.DELETE',
      message: 'NOTIFICATIONS.DELETE_CONFIRM',
      type: 'danger',
      confirmLabel: 'COMMON.DELETE'
    });

    if (confirmed) {
      this.patientService.deletePatient(id.toString());
      this.notificationService.info('NOTIFICATIONS.PROFILE_DELETED');
      this.cdr.markForCheck();
    }
  }
}


import { Component, OnInit, OnDestroy } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Patient } from '../../../models/patient.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html'
})
export class PatientsComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm = '';
  private sub!: Subscription;

  // Modal state
  showModal = false;
  newPatient: Partial<Patient> = { gender: 'Masculin' };

  constructor(
    private patientService: PatientService,
    private medicalRecordService: MedicalRecordService
  ) {}

  ngOnInit() {
    this.sub = this.patientService.getPatients().subscribe(data => {
      this.patients = data;
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPatients = this.patients;
      this.currentPage = 1;
      return;
    }
    this.filteredPatients = this.patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
    this.currentPage = 1;
  }

  openNewPatientModal() {
    this.newPatient = { gender: 'Masculin' };
    this.showModal = true;
  }

  submitNewPatient() {
    if (!this.newPatient.firstName || !this.newPatient.lastName || !this.newPatient.phone || !this.newPatient.birthDate || !this.newPatient.address) {
      alert('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    const patientId = Date.now();
    const patient: Patient = {
      id: patientId,
      firstName: this.newPatient.firstName,
      lastName: this.newPatient.lastName,
      phone: this.newPatient.phone,
      birthDate: this.newPatient.birthDate,
      address: this.newPatient.address,
      gender: this.newPatient.gender || 'Masculin',
      email: this.newPatient.email || '',
      lastVisit: new Date().toISOString()
    };

    this.patientService.addPatient(patient);
    this.medicalRecordService.initializeRecord(patientId.toString());
    this.showModal = false;
    this.newPatient = { gender: 'Masculin' };
  }

  // Pagination logic
  currentPage = 1;
  itemsPerPage = 10;

  get paginatedPatients() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPatients.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredPatients.length / this.itemsPerPage) || 1;
  }

  changePage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
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
}


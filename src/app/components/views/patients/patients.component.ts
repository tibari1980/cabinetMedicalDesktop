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
      return;
    }
    this.filteredPatients = this.patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
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

  trackByPatient(index: number, patient: Patient): string {
    return patient.id.toString();
  }
}


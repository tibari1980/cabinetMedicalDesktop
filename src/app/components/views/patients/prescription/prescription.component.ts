import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../../services/patient.service';
import { PrescriptionService } from '../../../../services/prescription.service';
import { ClinicService } from '../../../../services/clinic.service';
import { AuthService } from '../../../../services/auth.service';
import { Patient } from '../../../../models/patient.model';
import { Prescription, PrescriptionItem } from '../../../../models/prescription.model';
import { ClinicInfo } from '../../../../models/clinic.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html'
})
export class PrescriptionComponent implements OnInit, OnDestroy {
  patient!: Patient;
  clinic!: ClinicInfo;
  prescription: Prescription = {
    id: Math.random().toString(36).substr(2, 9),
    patientId: '',
    date: new Date().toISOString(),
    doctorName: '',
    items: []
  };

  newItem: PrescriptionItem = { id: '', medicationName: '', dosage: '', duration: '' };
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private prescriptionService: PrescriptionService,
    private clinicService: ClinicService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const sub1 = this.patientService.getPatientById(id).subscribe(p => {
        if (p) {
          this.patient = p;
          this.prescription.patientId = id;
        }
      });
      this.subs.push(sub1);
    }

    const sub2 = this.clinicService.clinic$.subscribe(c => this.clinic = c);
    this.subs.push(sub2);
    
    const user = this.authService.currentUserValue;
    if (user) {
      this.prescription.doctorName = `${user.firstName} ${user.lastName}`;
      this.prescription.doctorSpecialty = user.specialty;
    }

    // Start with one empty item
    this.addItem();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  addItem() {
    this.prescription.items.push({
      id: Math.random().toString(36).substr(2, 9),
      medicationName: '',
      dosage: '',
      duration: ''
    });
  }

  removeItem(index: number) {
    this.prescription.items.splice(index, 1);
  }

  saveAndPrint() {
    // Filter out empty items
    this.prescription.items = this.prescription.items.filter(i => i.medicationName.trim() !== '');
    if (this.prescription.items.length > 0) {
      this.prescriptionService.addPrescription(this.prescription);
      window.print();
    } else {
      alert('Veuillez ajouter au moins un médicament.');
    }
  }

  goBack() {
    this.router.navigate(['/patients', this.patient.id, 'record']);
  }

  trackByItem(index: number, item: PrescriptionItem): string {
    return item.id;
  }
}


import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../../services/patient.service';
import { PrescriptionService } from '../../../../services/prescription.service';
import { ClinicService } from '../../../../services/clinic.service';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { Patient } from '../../../../models/patient.model';
import { Prescription, PrescriptionItem } from '../../../../models/prescription.model';
import { ClinicInfo } from '../../../../models/clinic.model';
import { User, UserRole } from '../../../../models/user.model';
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

  isDuplicate: boolean = false;

  newItem: PrescriptionItem = { id: '', medicationName: '', dosage: '', duration: '' };
  paperFormat: 'A4' | 'A5' = 'A5';
  
  doctors: User[] = [];
  selectedDoctorId: string = '';
  isDoctor: boolean = false;
  
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private prescriptionService: PrescriptionService,
    private clinicService: ClinicService,
    private authService: AuthService,
    private notificationService: NotificationService
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
    
    // Charger la liste des docteurs
    this.doctors = this.authService.getDoctors();
    const user = this.authService.currentUserValue;
    
    if (user) {
      this.isDoctor = user.role === UserRole.DOCTOR;
      if (this.isDoctor) {
        this.selectedDoctorId = user.id;
        this.updateDoctorInfo(user);
      } else if (this.doctors.length > 0) {
        // Sélectionne le premier docteur par défaut si c'est une secrétaire
        this.selectedDoctorId = this.doctors[0].id;
        this.updateDoctorInfo(this.doctors[0]);
      }
    }

    // Start with one empty item if not a duplicate
    const duplicateId = this.route.snapshot.queryParamMap.get('duplicateId');
    if (duplicateId) {
      const existing = this.prescriptionService.getPrescriptionById(duplicateId);
      if (existing) {
        this.prescription = JSON.parse(JSON.stringify(existing));
        this.isDuplicate = true;
        this.selectedDoctorId = this.doctors.find(d => `${d.firstName} ${d.lastName}` === this.prescription.doctorName)?.id || this.selectedDoctorId;
      }
    } else {
      this.addItem();
    }
  }

  onDoctorChange() {
    const doc = this.doctors.find(d => d.id === this.selectedDoctorId);
    if (doc) {
      this.updateDoctorInfo(doc);
    }
  }

  private updateDoctorInfo(doc: User) {
    this.prescription.doctorName = `${doc.firstName} ${doc.lastName}`;
    this.prescription.doctorSpecialty = doc.specialty || '';
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // --- Core Methods ---

  /**
   * Main action for new prescriptions: Save to history and trigger print
   */
  async saveAndPrint() {
    if (!this.validatePrescription()) return;

    try {
      // Clean empty items before saving
      this.prescription.items = this.prescription.items.filter(i => i.medicationName.trim() !== '');
      
      // Save to local storage service
      await this.prescriptionService.addPrescription(this.prescription);
      
      this.notificationService.success('NOTIFICATIONS.PRESCRIPTION_SAVED');
      this.triggerPrint();
    } catch (error) {
      this.notificationService.error('NOTIFICATIONS.SAVE_ERROR');
    }
  }

  /**
   * Action for duplicates: Just print without saving a new record
   */
  printExisting() {
    this.triggerPrint();
  }

  /**
   * Simulated Download (Professional UX)
   */
  downloadPDF() {
    this.notificationService.info('Génération du PDF en cours...');
    // We use the browser's print to PDF capability which is the most reliable
    this.triggerPrint();
  }

  private triggerPrint() {
    setTimeout(() => window.print(), 100);
  }

  private validatePrescription(): boolean {
    const hasItems = this.prescription.items.some(i => i.medicationName.trim() !== '');
    if (!hasItems) {
      this.notificationService.warning('NOTIFICATIONS.REQUIRED_MEDICATION');
      return false;
    }
    return true;
  }

  // --- UI Helpers ---

  addItem() {
    if (this.isDuplicate) return; // Integrity check
    this.prescription.items.push({
      id: Math.random().toString(36).substr(2, 9),
      medicationName: '',
      dosage: '',
      duration: ''
    });
  }

  removeItem(index: number) {
    if (this.isDuplicate) return;
    this.prescription.items.splice(index, 1);
  }

  goBack() {
    this.router.navigate(['/patients', this.patient?.id || '', 'record']);
  }

  getPatientAge(): number {
    if (!this.patient?.birthDate) return 0;
    const birthDate = new Date(this.patient.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  trackByItem(index: number, item: PrescriptionItem): string {
    return item.id;
  }
}


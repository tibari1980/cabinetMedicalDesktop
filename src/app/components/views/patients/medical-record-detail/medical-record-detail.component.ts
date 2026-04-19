import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../../services/patient.service';
import { MedicalRecordService } from '../../../../services/medical-record.service';
import { AuthService } from '../../../../services/auth.service';
import { Patient } from '../../../../models/patient.model';
import { MedicalRecord, Consultation, ConsultationStatus, VitalSigns } from '../../../../models/medical-record.model';

@Component({
  selector: 'app-medical-record-detail',
  templateUrl: './medical-record-detail.component.html'
})
export class MedicalRecordDetailComponent implements OnInit {
  patient!: Patient;
  record!: MedicalRecord;
  activeConsultation: Consultation | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private recordService: MedicalRecordService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientService.getPatientById(id).subscribe(p => {
        if (p) {
          this.patient = p;
          this.loadRecord(id);
        } else {
          this.router.navigate(['/patients']);
        }
      });
    }
  }

  loadRecord(patientId: string) {
    let rec = this.recordService.getRecordByPatientId(patientId);
    if (!rec) {
      this.recordService.initializeRecord(patientId);
      rec = this.recordService.getRecordByPatientId(patientId);
    }
    if (rec) {
      this.record = rec;
    }
  }

  startNewConsultation() {
    const user = this.authService.currentUserValue;
    this.activeConsultation = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: this.patient.id.toString(),
      date: new Date().toISOString(),
      doctorName: user ? `${user.firstName} ${user.lastName}` : 'Docteur',
      doctorSpecialty: user?.specialty || '',
      subjective: { chiefComplaint: '', history: '' },
      objective: { 
        vitalSigns: { weight: 0, height: 0, bmi: 0, bloodPressureSys: 0, bloodPressureDia: 0, temperature: 0, heartRate: 0, oxygenSaturation: 0 }, 
        physicalExam: '' 
      },
      assessment: { diagnosis: '', notes: '' },
      plan: { treatment: '', followUp: '' },
      status: ConsultationStatus.DRAFT
    };
  }

  calculateBMI() {
    if (this.activeConsultation) {
      const v = this.activeConsultation.objective.vitalSigns;
      if (v.weight && v.height && v.height > 0) {
        const heightM = v.height / 100;
        v.bmi = Number((v.weight / (heightM * heightM)).toFixed(1));
      }
    }
  }

  saveConsultation(validate: boolean = false) {
    if (this.activeConsultation) {
      if (validate) {
        this.activeConsultation.status = ConsultationStatus.VALIDATED;
      }
      this.recordService.addConsultation(this.patient.id.toString(), this.activeConsultation);
      if (validate) {
        this.activeConsultation = null;
      }
      this.loadRecord(this.patient.id.toString());
    }
  }

  cancelConsultation() {
    this.activeConsultation = null;
  }
}

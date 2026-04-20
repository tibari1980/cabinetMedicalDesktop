import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../../services/patient.service';
import { MedicalRecordService } from '../../../../services/medical-record.service';
import { AuthService } from '../../../../services/auth.service';
import { Patient } from '../../../../models/patient.model';
import { MedicalRecord, Consultation, ConsultationStatus, VitalSigns } from '../../../../models/medical-record.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-medical-record-detail',
  templateUrl: './medical-record-detail.component.html'
})
export class MedicalRecordDetailComponent implements OnInit, OnDestroy {
  patient!: Patient;
  record!: MedicalRecord;
  activeConsultation: Consultation | null = null;
  private sub!: Subscription;

  // Gabarits de consultation (Killer Feature: SOAP Assists)
  templates = [
    { 
      id: 'grippe', 
      label: 'Grippe / Syndrome Grippal', 
      data: {
        subjective: { chiefComplaint: 'Fièvre, courbatures, fatigue intense depuis 48h.', history: 'Début brutal. Pas de signes de gravité respiratoires.' },
        objective: { physicalExam: 'Auscultation pulmonaire libre. Gorge inflammatoire. Pas de ganglions.' },
        assessment: { diagnosis: 'Syndrome Grippal saisonnier', notes: 'Surveillance de la température.' },
        plan: { treatment: 'Paracétamol 1g (1x3/j) / Repos / Hydratation.' }
      }
    },
    { 
      id: 'hta', 
      label: 'Suivi Hypertension (HTA)', 
      data: {
        subjective: { chiefComplaint: 'Consultation de suivi systématique.', history: 'Patient connu hypertendu sous traitement régulier.' },
        objective: { physicalExam: 'Examen cardio-vasculaire normal. Pas d\'oedème des membres inférieurs.' },
        assessment: { diagnosis: 'Hypertension Artérielle contrôlée', notes: 'Bonne tolérance du traitement.' },
        plan: { treatment: 'Continuer le traitement actuel. Prochain contrôle dans 3 mois.' }
      }
    },
    { 
      id: 'routine', 
      label: 'Examen de Routine / Check-up', 
      data: {
        subjective: { chiefComplaint: 'Bilan de santé annuel.', history: 'Pas de plaintes particulières.' },
        objective: { physicalExam: 'Examen complet normal. Constantes stables.' },
        assessment: { diagnosis: 'Patient en bonne santé apparente', notes: 'Bilan préventif.' },
        plan: { treatment: 'Encourager l\'activité physique régulière. Alimentation équilibrée.' }
      }
    }
  ];
  
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
      this.sub = this.patientService.getPatientById(id).subscribe(p => {
        if (p) {
          this.patient = p;
          this.loadRecord(id);
        } else {
          this.router.navigate(['/patients']);
        }
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
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

  applyTemplate(templateId: string) {
    const template = this.templates.find(t => t.id === templateId);
    if (template && this.activeConsultation) {
      this.activeConsultation.subjective.chiefComplaint = template.data.subjective.chiefComplaint;
      this.activeConsultation.subjective.history = template.data.subjective.history;
      this.activeConsultation.objective.physicalExam = template.data.objective.physicalExam;
      this.activeConsultation.assessment.diagnosis = template.data.assessment.diagnosis;
      this.activeConsultation.assessment.notes = template.data.assessment.notes;
      this.activeConsultation.plan.treatment = template.data.plan.treatment;
    }
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
      
      const isExisting = this.record.consultations.some(c => c.id === this.activeConsultation!.id);
      if (isExisting) {
        this.recordService.updateConsultation(this.patient.id.toString(), this.activeConsultation);
      } else {
        this.recordService.addConsultation(this.patient.id.toString(), this.activeConsultation);
      }
      
      if (validate) {
        this.activeConsultation = null;
      }
      this.loadRecord(this.patient.id.toString());
    }
  }

  cancelConsultation() {
    this.activeConsultation = null;
  }

  viewConsultation(consult: Consultation) {
    // Clone pour éviter les modifications en vue directe sans sauvegarder
    this.activeConsultation = JSON.parse(JSON.stringify(consult));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  printRecord() {
    window.print();
  }

  trackByAllergy(index: number, allergy: string): string {
    return allergy;
  }

  trackByDisease(index: number, disease: string): string {
    return disease;
  }

  trackByConsultation(index: number, consultation: Consultation): string {
    return consultation.id.toString();
  }
}


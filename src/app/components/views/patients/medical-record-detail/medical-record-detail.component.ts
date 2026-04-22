import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../../services/patient.service';
import { MedicalRecordService } from '../../../../services/medical-record.service';
import { AuthService } from '../../../../services/auth.service';
import { Patient } from '../../../../models/patient.model';
import { MedicalRecord, Consultation, ConsultationStatus, VitalSigns } from '../../../../models/medical-record.model';
import { UserRole } from '../../../../models/user.model';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../../services/notification.service';
import { DialogService } from '../../../../services/dialog.service';
import { PrescriptionService } from '../../../../services/prescription.service';
import { Prescription } from '../../../../models/prescription.model';

@Component({
  selector: 'app-medical-record-detail',
  templateUrl: './medical-record-detail.component.html'
})
export class MedicalRecordDetailComponent implements OnInit, OnDestroy {
  patient!: Patient;
  record!: MedicalRecord;
  prescriptions: Prescription[] = [];
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
  
  get latestVitals(): VitalSigns | null {
    if (this.record?.consultations?.length > 0) {
      // Les consultations sont déjà triées par date décroissante (unshift dans le service)
      const firstValid = this.record.consultations.find(c => 
        (c.objective.vitalSigns?.weight ?? 0) > 0 || 
        (c.objective.vitalSigns?.bloodPressureSys ?? 0) > 0
      );
      return firstValid ? firstValid.objective.vitalSigns : this.record.consultations[0].objective.vitalSigns;
    }
    return null;
  }
  
  UserRole = UserRole;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private recordService: MedicalRecordService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private prescriptionService: PrescriptionService,
    public authService: AuthService
  ) {}

  async addAllergy() {
    const allergy = prompt('Entrez le nom de l\'allergie :');
    if (allergy?.trim()) {
      await this.recordService.addAllergy(this.patient.id.toString(), allergy.trim());
      this.loadRecord(this.patient.id.toString());
      this.notificationService.success('NOTIFICATIONS.SAVED_SUCCESS');
    }
  }

  async removeAllergy(allergy: string) {
    if (confirm(`Supprimer l'allergie "${allergy}" ?`)) {
      await this.recordService.removeAllergy(this.patient.id.toString(), allergy);
      this.loadRecord(this.patient.id.toString());
    }
  }

  async addChronicDisease() {
    const disease = prompt('Entrez la pathologie :');
    if (disease?.trim()) {
      await this.recordService.addChronicDisease(this.patient.id.toString(), disease.trim());
      this.loadRecord(this.patient.id.toString());
      this.notificationService.success('NOTIFICATIONS.SAVED_SUCCESS');
    }
  }

  async removeChronicDisease(disease: string) {
    if (confirm(`Supprimer la pathologie "${disease}" ?`)) {
      await this.recordService.removeChronicDisease(this.patient.id.toString(), disease);
      this.loadRecord(this.patient.id.toString());
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sub = this.patientService.getPatientById(id).subscribe(p => {
        if (p) {
          this.patient = p;
          this.loadRecord(id);
          
          // Auto-start consultation if requested via query param
          if (this.route.snapshot.queryParamMap.get('startConsultation') === 'true') {
            this.startNewConsultation();
          }
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
      this.prescriptions = this.prescriptionService.getPrescriptionsByPatientId(patientId);
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

  async saveConsultation(lock: boolean) {
    if (!this.activeConsultation) return;

    const v = this.activeConsultation.objective.vitalSigns;
    const s = this.activeConsultation.subjective;
    const o = this.activeConsultation.objective;
    const a = this.activeConsultation.assessment;
    const p = this.activeConsultation.plan;
    
    // 1. Critical Field Validations (Mandatory if locking)
    if (lock) {
      if (!s.chiefComplaint?.trim()) {
        this.notificationService.error('VALIDATION.REQUIRED_CHIEF_COMPLAINT');
        return;
      }
      if (!o.physicalExam?.trim()) {
        this.notificationService.error('VALIDATION.REQUIRED_PHYSICAL_EXAM');
        return;
      }
      if (!a.diagnosis?.trim()) {
        this.notificationService.error('VALIDATION.REQUIRED_DIAGNOSIS');
        return;
      }
      if (!p.treatment?.trim()) {
        this.notificationService.error('VALIDATION.REQUIRED_TREATMENT');
        return;
      }
    }

    // 2. Clinical Range Validations (Always checked if values provided)
    if (v.temperature && (v.temperature > 45 || v.temperature < 30)) {
      this.notificationService.error('VALIDATION.TEMP_OUT_OF_RANGE');
      return;
    }

    if (v.bloodPressureSys && (v.bloodPressureSys > 250 || v.bloodPressureSys < 40)) {
      this.notificationService.error('VALIDATION.BP_SYS_OUT_OF_RANGE');
      return;
    }

    if (v.bloodPressureDia && (v.bloodPressureDia > 150 || v.bloodPressureDia < 40)) {
      this.notificationService.error('VALIDATION.BP_DIA_OUT_OF_RANGE');
      return;
    }

    if (v.bloodPressureSys && v.bloodPressureDia && v.bloodPressureSys <= v.bloodPressureDia) {
      this.notificationService.error('VALIDATION.BP_SYS_DIA_ERROR');
      return;
    }

    if (v.weight && (v.weight < 0 || v.weight > 600)) {
      this.notificationService.error('VALIDATION.WEIGHT_OUT_OF_RANGE');
      return;
    }

    if (v.height && (v.height < 0 || v.height > 250)) {
      this.notificationService.error('VALIDATION.HEIGHT_OUT_OF_RANGE');
      return;
    }

    // 3. Locking confirmation
    if (lock) {
      const result = await this.dialogService.confirm({
        title: 'VALIDATION.CONFIRMATION',
        message: 'Une fois validée, la consultation sera verrouillée et ne pourra plus être modifiée. Confirmer ?'
      });
      if (!result.confirmed) return;
      this.activeConsultation.status = ConsultationStatus.VALIDATED;
    } else {
      this.activeConsultation.status = ConsultationStatus.DRAFT;
    }

    // 4. Persistence
    const isExisting = this.record.consultations.some(c => c.id === this.activeConsultation!.id);
    if (isExisting) {
      await this.recordService.updateConsultation(this.patient.id.toString(), this.activeConsultation);
    } else {
      await this.recordService.addConsultation(this.patient.id.toString(), this.activeConsultation);
    }
    
    if (lock) {
      this.activeConsultation = null;
    }
    this.loadRecord(this.patient.id.toString());
    this.notificationService.success('NOTIFICATIONS.SAVED_SUCCESS');
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

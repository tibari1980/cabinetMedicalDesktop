export enum ConsultationStatus {
  DRAFT = 'Brouillon',
  VALIDATED = 'Validé',
  CANCELLED = 'Annulé'
}

export interface VitalSigns {
  temperature?: number; // °C
  bloodPressureSys?: number; // mmHg
  bloodPressureDia?: number; // mmHg
  heartRate?: number; // bpm
  weight?: number; // kg
  height?: number; // cm
  bmi?: number; // Calculé
  oxygenSaturation?: number; // %
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  doctorSpecialty?: string;
  
  // Structure SOAP
  subjective: {
    chiefComplaint: string;
    history: string;
  };
  objective: {
    vitalSigns: VitalSigns;
    physicalExam: string;
  };
  assessment: {
    diagnosis: string;
    notes: string;
  };
  plan: {
    treatment: string;
    followUp: string;
  };
  
  status: ConsultationStatus;
}

export interface MedicalRecord {
  patientId: string;
  bloodType?: string;
  allergies: string[];
  chronicDiseases: string[];
  consultations: Consultation[];
  lastUpdate: string;
}

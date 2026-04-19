export enum AppointmentType {
  CONSULTATION = 'Consultation Générale',
  FOLLOW_UP = 'Suivi',
  EMERGENCY = 'Urgence',
  EXAM = 'Examen / Analyse'
}

export enum AppointmentStatus {
  CONFIRMED = 'Confirmé',
  WAITING = 'En attente',
  CANCELLED = 'Annulé',
  DONE = 'Terminé'
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // ISO format YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  note?: string;
}

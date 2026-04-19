export interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string; // ex: 1 comp 3x/jour
  duration: string; // ex: 7 jours
  quantity?: string; // ex: 2 boites
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  doctorSpecialty?: string;
  items: PrescriptionItem[];
}

export interface Invoice {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  patientAddress?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientBirthDate?: string;
  appointmentId?: string;
  amountModifier: number; // To track pure amount (HT)
  taxRate: number; // e.g. 0 or 20
  totalTTC: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  description?: string;
}

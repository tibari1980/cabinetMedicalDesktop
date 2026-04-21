export interface Patient {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  lastVisit: string;
  nextAppointment?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  SECRETARY = 'SECRETARY'
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  specialty?: string; // Optionnel pour Secrétaire, requis pour Docteur
  clinicId?: string;
  email?: string;
  avatar?: string;
  password?: string;
  phone?: string;
}

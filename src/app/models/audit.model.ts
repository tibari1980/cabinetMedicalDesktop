export enum AuditAction {
  LOGIN = 'CONNEXION',
  LOGOUT = 'DÉCONNEXION',
  CREATE_PATIENT = 'CRÉATION_PATIENT',
  EDIT_PATIENT = 'MODIF_PATIENT',
  VIEW_PATIENT = 'CONSULTATION_PATIENT',
  CREATE_APPOINTMENT = 'CRÉATION_RDV',
  CREATE_CONSULTATION = 'CRÉATION_CONSULTATION',
  CREATE_PRESCRIPTION = 'CRÉATION_ORDONNANCE',
  EDIT_SETTINGS = 'MODIF_PARAMÈTRES',
  USER_MANAGEMENT = 'GESTION_UTILISATEURS'
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  details: string;
}

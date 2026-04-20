import { Component } from '@angular/core';
import { ClinicService } from '../../../services/clinic.service';
import { AuditService } from '../../../services/audit.service';
import { ClinicInfo } from '../../../models/clinic.model';
import { AuditAction } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';
import { UserRole, User } from '../../../models/user.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent {
  clinicInfo: ClinicInfo = { name: '', openingHour: 8, closingHour: 18 };
  logs$ = this.auditService.logs$;

  staff$ = this.authService.users$;

  UserRole = UserRole;

  constructor(
    private clinicService: ClinicService,
    private auditService: AuditService,
    private authService: AuthService
  ) {
    this.clinicInfo = { ...this.clinicService.getClinicValue() };
  }

  saveClinicInfo() {
    this.clinicService.updateInfo(this.clinicInfo);
    this.auditService.log(
      this.authService.currentUserValue, 
      AuditAction.EDIT_SETTINGS, 
      `Mise à jour des informations du cabinet : ${this.clinicInfo.name}`
    );
    alert('Paramètres enregistrés localement avec succès !');
  }

  // GESTION DES PROFILS (ÉQUIPE)
  showProfileModal = false;
  selectedProfile: Partial<User> = {};
  isNewProfile = false;

  openProfileModal(user?: User) {
    if (user) {
      this.isNewProfile = false;
      this.selectedProfile = { ...user };
    } else {
      this.isNewProfile = true;
      this.selectedProfile = {
        id: Math.random().toString(36).substr(2, 9),
        username: '',
        firstName: '',
        lastName: '',
        role: UserRole.DOCTOR,
        email: '',
        specialty: ''
      };
    }
    this.showProfileModal = true;
  }

  saveProfile() {
    if (!this.selectedProfile.firstName || !this.selectedProfile.username) {
      alert("Le nom d'utilisateur et le prénom sont obligatoires.");
      return;
    }
    
    this.authService.addOrUpdateUser(this.selectedProfile as User);
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.EDIT_SETTINGS,
      `Profil de ${this.selectedProfile.firstName} (Rôle: ${this.selectedProfile.role}) enregistré.`
    );
    this.showProfileModal = false;
  }

  deleteProfile(user: User, event: Event) {
    event.stopPropagation();
    if(confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${user.firstName} ?`)) {
      this.authService.deleteUser(user.id);
      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.EDIT_SETTINGS,
        `Profil de ${user.firstName} supprimé.`
      );
    }
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.clinicInfo.logo = e.target.result;
        this.saveClinicInfo();
      };
      reader.readAsDataURL(file);
    }
  }
}

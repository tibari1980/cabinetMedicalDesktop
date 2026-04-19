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
  clinicInfo: ClinicInfo = { name: '' };
  logs$ = this.auditService.logs$;

  staff: User[] = [
    { id: '1', username: 'dr.miller', firstName: 'Sarah', lastName: 'Miller', role: UserRole.DOCTOR, email: 'dr.miller@clinique.ma' },
    { id: '2', username: 'amine.b', firstName: 'Amine', lastName: 'Bennani', role: UserRole.SECRETARY, email: 'amine@clinique.ma' },
    { id: '3', username: 'admin.sophie', firstName: 'Sophie', lastName: 'Martin', role: UserRole.ADMIN, email: 'sophie@clinique.ma' }
  ];

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

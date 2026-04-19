import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ClinicService } from '../../../services/clinic.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  UserRole = UserRole;

  constructor(
    public authService: AuthService,
    public clinicService: ClinicService
  ) {}

  getIconSettings(isActive: boolean): string {
    return isActive ? "'FILL' 1" : "'FILL' 0";
  }
}

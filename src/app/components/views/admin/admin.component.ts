import { Component } from '@angular/core';
import { AuditService } from '../../../services/audit.service';
import { SeedService } from '../../../services/seed.service';
import { AuditAction } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';
import { UserRole, User } from '../../../models/user.model';
import { NotificationService } from '../../../services/notification.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent {
  logs$ = this.auditService.logs$;

  staff: User[] = [];
  filteredStaff: User[] = [];
  staffSearchTerm: string = '';

  UserRole = UserRole;

  constructor(
    private auditService: AuditService,
    public authService: AuthService,
    private seedService: SeedService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {
    this.authService.users$.subscribe(users => {
      this.staff = users;
      this.applyStaffFilter();
    });
  }

  applyStaffFilter() {
    const term = this.staffSearchTerm.toLowerCase().trim();
    const currentUser = this.authService.currentUserValue;

    // Hierarchy Filter: Only show users the current user can manage
    // Exception: Show yourself if you are an admin
    let visibleUsers = this.staff.filter(u => 
      this.authService.canManage(u) || u.id === currentUser?.id
    );

    if (!term) {
      this.filteredStaff = visibleUsers;
      return;
    }

    this.filteredStaff = visibleUsers.filter(u =>
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      u.specialty?.toLowerCase().includes(term)
    );
  }

  // GESTION DES PROFILS (ÉQUIPE)
  showProfileModal = false;
  selectedProfile: Partial<User> = {};
  isNewProfile = false;
  errors: any = {};

  openProfileModal(user?: User) {
    if (user) {
      // Security Guard: Prevent open edit if cannot manage
      if (!this.authService.canManage(user) && user.id !== this.authService.currentUserValue?.id) {
        this.notificationService.error("NOTIFICATIONS.UNAUTHORIZED");
        return;
      }
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

  async saveProfile() {
    this.errors = {};
    const actor = this.authService.currentUserValue;

    // Field Validations
    if (!this.selectedProfile.firstName?.trim()) {
      this.errors.firstName = 'REQUIRED';
    } else if (this.selectedProfile.firstName.trim().length < 2) {
      this.errors.firstName = 'MIN';
    }

    if (!this.selectedProfile.lastName?.trim()) {
      this.errors.lastName = 'REQUIRED';
    } else if (this.selectedProfile.lastName.trim().length < 2) {
      this.errors.lastName = 'MIN';
    }

    if (!this.selectedProfile.username?.trim()) {
      this.errors.username = 'REQUIRED';
    } else if (this.selectedProfile.username.trim().length < 4) {
      this.errors.username = 'MIN';
    }

    if (!this.selectedProfile.email?.trim()) {
      this.errors.email = 'REQUIRED';
    }

    // Uniqueness Checks
    if (this.selectedProfile.username && !this.authService.isUsernameUnique(this.selectedProfile.username, this.isNewProfile ? undefined : this.selectedProfile.id)) {
      this.errors.usernameTaken = true;
    }
    if (this.selectedProfile.email && !this.authService.isEmailUnique(this.selectedProfile.email, this.isNewProfile ? undefined : this.selectedProfile.id)) {
      this.errors.emailTaken = true;
    }

    // Role Escalation Guard
    if (this.selectedProfile.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      this.notificationService.error("NOTIFICATIONS.UNAUTHORIZED");
      return;
    }

    if (Object.keys(this.errors).length > 0) {
      this.notificationService.error('VALIDATION.REQUIRED');
      return;
    }
    
    await this.authService.addOrUpdateUser(this.selectedProfile as User);
    this.auditService.log(
      actor,
      this.isNewProfile ? AuditAction.EDIT_SETTINGS : AuditAction.EDIT_SETTINGS,
      `Profil de ${this.selectedProfile.firstName} (Rôle: ${this.selectedProfile.role}) enregistré.`
    );
    this.showProfileModal = false;
    this.notificationService.success("NOTIFICATIONS.PROFILE_SAVED");
  }

  async deleteProfile(user: User, event: Event) {
    event.stopPropagation();
    
    // Security Guard
    if (!this.authService.canManage(user)) {
       this.notificationService.warning("NOTIFICATIONS.UNAUTHORIZED");
       return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'COMMON.DELETE',
      message: 'NOTIFICATIONS.DELETE_CONFIRM',
      type: 'danger',
      confirmLabel: 'COMMON.DELETE',
      params: { name: `${user.firstName} ${user.lastName}` }
    });

    if (confirmed) {
      this.authService.deleteUser(user.id);
      this.auditService.log(
        this.authService.currentUserValue,
        AuditAction.EDIT_SETTINGS,
        `Profil de ${user.firstName} supprimé.`
      );
    }
  }

  isSeeding = false;
  async runStressTest() {
    const confirmed = await this.dialogService.confirm({
      title: 'PERF.TITLE',
      message: 'NOTIFICATIONS.GENERATE_PATIENTS_CONFIRM',
      type: 'warning',
      confirmLabel: 'COMMON.VALIDATE'
    });

    if (confirmed) {
      this.isSeeding = true;
      await this.seedService.seedPatients(1000);
      this.isSeeding = false;
      this.notificationService.success("NOTIFICATIONS.GENERATE_PATIENTS_SUCCESS");
    }
  }
}

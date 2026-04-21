import { Component } from '@angular/core';
import { AuditService } from '../../../services/audit.service';
import { SeedService } from '../../../services/seed.service';
import { AuditAction } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';
import { UserRole, User } from '../../../models/user.model';

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
    private seedService: SeedService
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

  openProfileModal(user?: User) {
    if (user) {
      // Security Guard: Prevent open edit if cannot manage
      if (!this.authService.canManage(user) && user.id !== this.authService.currentUserValue?.id) {
        alert("Action non autorisée : Vous n'avez pas les droits pour modifier ce profil.");
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

  saveProfile() {
    if (!this.selectedProfile.firstName || !this.selectedProfile.username) {
      alert("Le nom d'utilisateur et le prénom sont obligatoires.");
      return;
    }

    // Role Escalation Guard: Only SUPER_ADMIN can create/promote to SUPER_ADMIN
    if (this.selectedProfile.role === UserRole.SUPER_ADMIN && this.authService.currentUserValue?.role !== UserRole.SUPER_ADMIN) {
      alert("Action non autorisée : Seul un Super Administrateur peut assigner ce rôle.");
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
    
    // Security Guard
    if (!this.authService.canManage(user)) {
       alert("Action non autorisée : Impossible de supprimer un profil de rang supérieur ou protégé.");
       return;
    }

    if(confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${user.firstName} ?`)) {
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
    if (confirm("Générer 1000 patients de test ? Cela peut prendre quelques secondes.")) {
      this.isSeeding = true;
      await this.seedService.seedPatients(1000);
      this.isSeeding = false;
      alert("1000 patients générés avec succès !");
    }
  }
}

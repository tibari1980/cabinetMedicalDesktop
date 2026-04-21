import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private usersSubject: BehaviorSubject<User[]>;
  public users$: Observable<User[]>;

  constructor(
    private router: Router,
    private auditService: AuditService
  ) {
    const savedUsers = localStorage.getItem('mf_users');
    let initialUsers = savedUsers ? JSON.parse(savedUsers) : [];

    this.usersSubject = new BehaviorSubject<User[]>(initialUsers);
    this.users$ = this.usersSubject.asObservable();

    const savedUser = localStorage.getItem('mf_session');
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser ? JSON.parse(savedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get usersValue(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Returns true if this is a brand-new installation (no users exist).
   */
  isFirstLaunch(): boolean {
    const users = localStorage.getItem('mf_users');
    const setupDone = localStorage.getItem('mf_setup_complete');
    return !setupDone && (!users || JSON.parse(users).length === 0);
  }

  /**
   * Creates the initial administrator during first-time setup.
   * This is the ONLY way to create the first user — no hardcoded defaults.
   */
  createInitialAdmin(user: User) {
    const users = [user];
    localStorage.setItem('mf_users', JSON.stringify(users));
    this.usersSubject.next(users);
  }

  getDoctors(): User[] {
    return this.usersValue.filter(u => u.role === UserRole.DOCTOR);
  }

  addOrUpdateUser(updatedUser: User) {
    const currentUsers = this.usersValue;
    const index = currentUsers.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
      currentUsers[index] = updatedUser;
    } else {
      currentUsers.push(updatedUser);
    }
    localStorage.setItem('mf_users', JSON.stringify(currentUsers));
    this.usersSubject.next([...currentUsers]);
    
    // Si c'est l'utilisateur courant, on update sa session
    if (this.currentUserValue?.id === updatedUser.id) {
      localStorage.setItem('mf_session', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  deleteUser(userId: string) {
    const newUsers = this.usersValue.filter(u => u.id !== userId);
    localStorage.setItem('mf_users', JSON.stringify(newUsers));
    this.usersSubject.next(newUsers);
  }

  login(username: string, password: string): Observable<boolean> {
    // Vérification du nom d'utilisateur ET du mot de passe
    const user = this.usersValue.find(u => u.username === username.toLowerCase() && u.password === password);
    
    if (user) {
      localStorage.setItem('mf_session', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.auditService.log(user, AuditAction.LOGIN, 'Session démarrée avec succès');
      return of(true);
    }
    return of(false);
  }

  changePassword(userId: string, newPassword: string) {
    const currentUsers = this.usersValue;
    const index = currentUsers.findIndex(u => u.id === userId);
    if (index > -1) {
      currentUsers[index].password = newPassword;
      localStorage.setItem('mf_users', JSON.stringify(currentUsers));
      this.usersSubject.next([...currentUsers]);
      
      // Update session if it's the current user
      if (this.currentUserValue?.id === userId) {
        const updatedUser = { ...this.currentUserValue, password: newPassword };
        localStorage.setItem('mf_session', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      }
      return true;
    }
    return false;
  }

  logout() {
    const user = this.currentUserValue;
    this.auditService.log(user, AuditAction.LOGOUT, 'Session terminée');
    localStorage.removeItem('mf_session');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserValue;
    return !!user && roles.includes(user.role);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  /**
   * Senior Hierarchy Logic: 
   * - SUPER_ADMIN can manage everyone.
   * - ADMIN can manage everyone EXCEPT SUPER_ADMIN.
   * - Others cannot manage anyone.
   */
  canManage(targetUser: User): boolean {
    const actor = this.currentUserValue;
    if (!actor || !targetUser) return false;
    
    if (actor.role === UserRole.SUPER_ADMIN) return true;
    
    if (actor.role === UserRole.ADMIN) {
      // ADMIN can manage other ADMINs, DOCTORs, SECRETARYs
      // BUT NEVER target a SUPER_ADMIN
      return targetUser.role !== UserRole.SUPER_ADMIN;
    }
    
    return false;
  }
}

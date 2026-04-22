import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { AuditService } from './audit.service';
import { AuditAction } from '../models/audit.model';
import { DatabaseService } from './database.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersSubject: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]>;

  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null>;

  private isInitializedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isInitialized$: Observable<boolean>;

  constructor(
    private router: Router,
    private auditService: AuditService,
    private encryptionService: EncryptionService,
    private dbService: DatabaseService
  ) {
    this.users$ = this.usersSubject.asObservable();
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isInitialized$ = this.isInitializedSubject.asObservable();
    this.initStaff();
  }

  private async initStaff() {
    try {
      // FORCE DEMO MODE: Mark setup as complete
      localStorage.setItem('mf_setup_complete', 'true');
      
      // 1. Try IndexedDB
      let users: User[] = await this.dbService.getAll<User>('users');

      // 2. Fallback to localStorage (Migration)
      if (users.length === 0) {
        const savedUsers = localStorage.getItem('mf_users');
        if (savedUsers) {
          users = JSON.parse(savedUsers);
          // Migrer vers IndexedDB
          for (const u of users) {
            await this.dbService.put('users', u);
          }
          localStorage.removeItem('mf_users');
        } else {
          // Init with Demo Users
          users = this.getDemoUsers();
          for (const u of users) {
            await this.dbService.put('users', u);
          }
        }
      }

      this.usersSubject.next(users);

      const savedUser = localStorage.getItem('mf_session');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
      
      this.isInitializedSubject.next(true);
    } catch (error) {
      console.error('AuthService initialization failed:', error);
      // Even if it fails, we should notify that initialization is "done" (even if empty)
      this.usersSubject.next(this.getDemoUsers()); 
      this.isInitializedSubject.next(true);
    }
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

  async addOrUpdateUser(updatedUser: User) {
    if (!updatedUser.id) {
      updatedUser.id = this.dbService.generateSecureId();
    }

    await this.dbService.put('users', updatedUser);
    
    const currentUsers = this.usersValue;
    const index = currentUsers.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
      currentUsers[index] = updatedUser;
    } else {
      currentUsers.push(updatedUser);
    }
    this.usersSubject.next([...currentUsers]);
    
    // Si c'est l'utilisateur courant, on update sa session
    if (this.currentUserValue?.id === updatedUser.id) {
      localStorage.setItem('mf_session', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  async deleteUser(userId: string) {
    await this.dbService.delete('users', userId);
    const newUsers = this.usersValue.filter(u => u.id !== userId);
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

  async changePassword(userId: string, newPassword: string) {
    const currentUsers = this.usersValue;
    const index = currentUsers.findIndex(u => u.id === userId);
    if (index > -1) {
      currentUsers[index].password = newPassword;
      await this.dbService.put('users', currentUsers[index]);
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

  private getDemoUsers(): User[] {
    return [
      {
        id: 'user-default-superadmin',
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        password: 'demo123',
        email: 'superadmin@mediflow.com'
      },
      {
        id: 'user-default-admin',
        username: 'admin.sophie',
        firstName: 'Sophie',
        lastName: 'Martin',
        role: UserRole.ADMIN,
        password: 'demo123',
        email: 's.martin@mediflow.com'
      },
      {
        id: 'user-default-doctor',
        username: 'dr.miller',
        firstName: 'James',
        lastName: 'Miller',
        role: UserRole.DOCTOR,
        password: 'demo123',
        specialty: 'Cardiologie',
        email: 'j.miller@mediflow.com'
      },
      {
        id: 'user-default-secretary',
        username: 'amine.b',
        firstName: 'Amine',
        lastName: 'Bennani',
        role: UserRole.SECRETARY,
        password: 'demo123',
        email: 'a.bennani@mediflow.com'
      }
    ];
  }

  isEmailUnique(email: string, excludeId?: string): boolean {
    if (!email) return true;
    return !this.usersValue.some(u => 
      u.email?.toLowerCase() === email.toLowerCase() && u.id !== excludeId
    );
  }

  isUsernameUnique(username: string, excludeId?: string): boolean {
    if (!username) return true;
    return !this.usersValue.some(u => 
      u.username?.toLowerCase() === username.toLowerCase() && u.id !== excludeId
    );
  }
}

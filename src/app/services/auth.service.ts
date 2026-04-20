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

  private defaultUsers: User[] = [
    { id: '1', username: 'superadmin', password: 'demo123', firstName: 'Jean', lastName: 'Dupont', role: UserRole.SUPER_ADMIN, email: 'admin@medconnect.pro' },
    { id: '2', username: 'admin.sophie', password: 'demo123', firstName: 'Sophie', lastName: 'Martin', role: UserRole.ADMIN, email: 'sophie@clinique.ma' },
    { id: '3', username: 'dr.miller', password: 'demo123', firstName: 'Sarah', lastName: 'Miller', role: UserRole.DOCTOR, email: 'dr.miller@clinique.ma', specialty: 'Cardiologue' },
    { id: '4', username: 'amine.b', password: 'demo123', firstName: 'Amine', lastName: 'Bennani', role: UserRole.SECRETARY, email: 'amine@clinique.ma' }
  ];

  constructor(
    private router: Router,
    private auditService: AuditService
  ) {
    const savedUsers = localStorage.getItem('mc_users');
    let initialUsers = savedUsers ? JSON.parse(savedUsers) : this.defaultUsers;
    
    // Expert Fix: Force sync default passwords for demo accounts to ensure demo123 always works
    this.defaultUsers.forEach(def => {
      const existing = initialUsers.find((u: User) => u.username === def.username);
      if (existing) {
        existing.password = def.password; // Force to 'demo123'
      } else {
        initialUsers.push(def);
      }
    });

    this.usersSubject = new BehaviorSubject<User[]>(initialUsers);
    this.users$ = this.usersSubject.asObservable();
    localStorage.setItem('mc_users', JSON.stringify(initialUsers));

    const savedUser = localStorage.getItem('mc_session');
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser ? JSON.parse(savedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get usersValue(): User[] {
    return this.usersSubject.value;
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
    localStorage.setItem('mc_users', JSON.stringify(currentUsers));
    this.usersSubject.next([...currentUsers]);
    
    // Si c'est l'utilisateur courant, on update sa session
    if (this.currentUserValue?.id === updatedUser.id) {
      localStorage.setItem('mc_session', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  deleteUser(userId: string) {
    const newUsers = this.usersValue.filter(u => u.id !== userId);
    localStorage.setItem('mc_users', JSON.stringify(newUsers));
    this.usersSubject.next(newUsers);
  }

  login(username: string, password: string): Observable<boolean> {
    // Vérification du nom d'utilisateur ET du mot de passe
    const user = this.usersValue.find(u => u.username === username.toLowerCase() && u.password === password);
    
    if (user) {
      localStorage.setItem('mc_session', JSON.stringify(user));
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
      localStorage.setItem('mc_users', JSON.stringify(currentUsers));
      this.usersSubject.next([...currentUsers]);
      
      // Update session if it's the current user
      if (this.currentUserValue?.id === userId) {
        const updatedUser = { ...this.currentUserValue, password: newPassword };
        localStorage.setItem('mc_session', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      }
      return true;
    }
    return false;
  }

  logout() {
    const user = this.currentUserValue;
    this.auditService.log(user, AuditAction.LOGOUT, 'Session terminée');
    localStorage.removeItem('mc_session');
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
}

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
    { id: '1', username: 'superadmin', firstName: 'Jean', lastName: 'Dupont', role: UserRole.SUPER_ADMIN, email: 'admin@medconnect.pro' },
    { id: '2', username: 'admin.sophie', firstName: 'Sophie', lastName: 'Martin', role: UserRole.ADMIN, email: 'sophie@clinique.ma' },
    { id: '3', username: 'dr.miller', firstName: 'Sarah', lastName: 'Miller', role: UserRole.DOCTOR, email: 'dr.miller@clinique.ma', specialty: 'Cardiologue' },
    { id: '4', username: 'amine.b', firstName: 'Amine', lastName: 'Bennani', role: UserRole.SECRETARY, email: 'amine@clinique.ma' }
  ];

  constructor(
    private router: Router,
    private auditService: AuditService
  ) {
    const savedUsers = localStorage.getItem('mc_users');
    const initialUsers = savedUsers ? JSON.parse(savedUsers) : this.defaultUsers;
    this.usersSubject = new BehaviorSubject<User[]>(initialUsers);
    this.users$ = this.usersSubject.asObservable();
    if (!savedUsers) {
      localStorage.setItem('mc_users', JSON.stringify(initialUsers));
    }

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
    // Simple mock logic - ignore password for demo or check against a fixed one
    const user = this.usersValue.find(u => u.username === username.toLowerCase());
    
    if (user) {
      localStorage.setItem('mc_session', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.auditService.log(user, AuditAction.LOGIN, 'Session démarrée avec succès');
      return of(true);
    }
    return of(false);
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

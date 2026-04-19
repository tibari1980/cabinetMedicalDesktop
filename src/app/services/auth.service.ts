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

  private mockUsers: User[] = [
    { id: '1', username: 'superadmin', firstName: 'Jean', lastName: 'Dupont', role: UserRole.SUPER_ADMIN, email: 'admin@medconnect.pro' },
    { id: '2', username: 'admin', firstName: 'Sophie', lastName: 'Martin', role: UserRole.ADMIN, email: 'sophie@clinique.ma' },
    { id: '3', username: 'doctor', firstName: 'Sarah', lastName: 'Miller', role: UserRole.DOCTOR, email: 'dr.miller@clinique.ma' },
    { id: '4', username: 'secretary', firstName: 'Amine', lastName: 'Bennani', role: UserRole.SECRETARY, email: 'amine@clinique.ma' }
  ];

  constructor(
    private router: Router,
    private auditService: AuditService
  ) {
    const savedUser = localStorage.getItem('mc_session');
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser ? JSON.parse(savedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<boolean> {
    // Simple mock logic - ignore password for demo or check against a fixed one
    const user = this.mockUsers.find(u => u.username === username.toLowerCase());
    
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

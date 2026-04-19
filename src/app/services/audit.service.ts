import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditLog, AuditAction } from '../models/audit.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private logsSubject: BehaviorSubject<AuditLog[]>;
  public logs$: Observable<AuditLog[]>;

  constructor() {
    const savedLogs = localStorage.getItem('mc_audit_logs');
    this.logsSubject = new BehaviorSubject<AuditLog[]>(savedLogs ? JSON.parse(savedLogs) : []);
    this.logs$ = this.logsSubject.asObservable();
  }

  log(user: User | null, action: AuditAction, details: string) {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      userId: user?.id || 'Inconnu',
      userName: user ? `${user.firstName} ${user.lastName}` : 'Système',
      userRole: user?.role || 'N/A',
      action: action,
      details: details
    };

    const currentLogs = this.logsSubject.value;
    const updatedLogs = [newLog, ...currentLogs]; // Plus récent en premier
    
    // Garder les 1000 derniers logs pour performance localStorage
    const trimmedLogs = updatedLogs.slice(0, 1000);
    
    localStorage.setItem('mc_audit_logs', JSON.stringify(trimmedLogs));
    this.logsSubject.next(trimmedLogs);
  }

  getLogs(): AuditLog[] {
    return this.logsSubject.value;
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditLog, AuditAction, AuditCategory } from '../models/audit.model';
import { User } from '../models/user.model';

import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private logsSubject: BehaviorSubject<AuditLog[]>;
  public logs$: Observable<AuditLog[]>;

  constructor(private dbService: DatabaseService) {
    this.logsSubject = new BehaviorSubject<AuditLog[]>([]);
    this.logs$ = this.logsSubject.asObservable();
    this.loadLogs();
  }

  private async loadLogs() {
    // Migration logic from localStorage if found
    const savedLogs = localStorage.getItem('mc_audit_logs');
    let initialLogs: AuditLog[] = [];
    
    if (savedLogs) {
      initialLogs = JSON.parse(savedLogs);
      // Migrate to IndexedDB
      await this.dbService.putAll('logs', initialLogs);
      localStorage.removeItem('mc_audit_logs');
    } else {
      initialLogs = await this.dbService.getAll<AuditLog>('logs');
    }

    this.logsSubject.next(initialLogs.map(log => ({
      ...log,
      category: log.category || AuditCategory.SYSTEM,
      severity: log.severity || 'INFO'
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  async log(
    user: User | null, 
    action: AuditAction, 
    details: string, 
    category: AuditCategory = AuditCategory.SYSTEM,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
  ) {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      userId: user?.id || 'Système',
      userName: user ? `${user.firstName} ${user.lastName}` : 'Système Automatisé',
      userRole: user?.role || 'N/A',
      action: action,
      details: details,
      category: category,
      severity: severity
    };

    // Save to IndexedDB (No limit)
    await this.dbService.put('logs', newLog);
    
    const currentLogs = this.logsSubject.value;
    this.logsSubject.next([newLog, ...currentLogs]);
  }

  getLogs(): AuditLog[] {
    return this.logsSubject.value;
  }

  async clearLogs() {
    await this.dbService.clear('logs');
    this.logsSubject.next([]);
  }
}


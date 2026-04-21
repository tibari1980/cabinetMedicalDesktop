import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditLog, AuditAction, AuditCategory } from '../models/audit.model';
import { User } from '../models/user.model';

import { DatabaseService } from './database.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private logsSubject: BehaviorSubject<AuditLog[]>;
  public logs$: Observable<AuditLog[]>;

  constructor(
    private dbService: DatabaseService,
    private encryptionService: EncryptionService
  ) {
    this.logsSubject = new BehaviorSubject<AuditLog[]>([]);
    this.logs$ = this.logsSubject.asObservable();
    this.loadLogs();
  }

  private async loadLogs() {
    try {
      // 1. Check for legacy localStorage logs
      const savedLogs = localStorage.getItem('mc_audit_logs');
      let logs: AuditLog[] = [];
      
      if (savedLogs) {
        logs = JSON.parse(savedLogs);
        // Migrate to IndexedDB with encryption
        for (const log of logs) {
          const encryptedData = await this.encryptionService.encrypt(log);
          await this.dbService.put('logs', { id: log.id, encryptedData });
        }
        localStorage.removeItem('mc_audit_logs');
      } else {
        // 2. Load from IndexedDB
        const rawLogs = await this.dbService.getAll<any>('logs');
        for (const item of rawLogs) {
          if (item.encryptedData) {
            const decrypted = await this.encryptionService.decrypt<AuditLog>(item.encryptedData);
            if (decrypted) logs.push(decrypted);
          } else {
            // Backward compatibility
            logs.push(item);
            this.dbService.put('logs', { 
              id: item.id, 
              encryptedData: await this.encryptionService.encrypt(item) 
            });
          }
        }
      }

      this.logsSubject.next(logs.map(log => ({
        ...log,
        category: log.category || AuditCategory.SYSTEM,
        severity: log.severity || 'INFO'
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Error loading audit logs:', error);
      this.logsSubject.next([]);
    }
  }

  async log(
    user: User | null, 
    action: AuditAction, 
    details: string, 
    category: AuditCategory = AuditCategory.SYSTEM,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
  ) {
    const newLog: AuditLog = {
      id: this.dbService.generateSecureId(),
      timestamp: new Date(),
      userId: user?.id || 'Système',
      userName: user ? `${user.firstName} ${user.lastName}` : 'Système Automatisé',
      userRole: user?.role || 'N/A',
      action: action,
      details: details,
      category: category,
      severity: severity
    };

    // Save to IndexedDB (Encrypted)
    const encryptedData = await this.encryptionService.encrypt(newLog);
    await this.dbService.put('logs', { id: newLog.id, encryptedData });
    
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


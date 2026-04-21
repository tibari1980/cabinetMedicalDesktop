import { Component, OnInit } from '@angular/core';
import { AuditService } from '../../../services/audit.service';
import { AuditLog, AuditAction, AuditCategory } from '../../../models/audit.model';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { map, Observable, combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-traceability',
  templateUrl: './traceability.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--color-primary), 0.1); 
      border-radius: 10px; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
      background: rgba(var(--color-primary), 0.2); 
    }
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;  
      overflow: hidden;
    }
  `]
})
export class TraceabilityComponent implements OnInit {
  logs$: Observable<AuditLog[]>;
  filteredLogs$: Observable<AuditLog[]>;
  
  searchTerm: string = '';
  selectedCategory: string = 'ALL';
  selectedSeverity: string = 'ALL';
  
  categories = Object.values(AuditCategory);
  
  // Stats helpers
  totalLogs: number = 0;
  medicalLogsCount: number = 0;
  criticalLogsCount: number = 0;

  constructor(
    private auditService: AuditService,
    public authService: AuthService
  ) {
    this.logs$ = this.auditService.logs$;
    this.filteredLogs$ = this.logs$;
  }

  ngOnInit(): void {
    this.applyFilters();
    
    // Subscribe to update stats
    this.logs$.subscribe(logs => {
      this.totalLogs = logs.length;
      this.medicalLogsCount = logs.filter(l => l.category === AuditCategory.MEDICAL).length;
      this.criticalLogsCount = logs.filter(l => l.severity === 'CRITICAL').length;
    });
  }

  applyFilters() {
    const currentUser = this.authService.currentUserValue;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    this.filteredLogs$ = this.logs$.pipe(
      map(logs => logs.filter(log => {
        // Hierarchy Security Logic: 
        // Admin should not see SuperAdmin logs to maintain isolation
        if (!isSuperAdmin && log.userName.includes('superadmin')) {
          return false; 
        }

        const matchesSearch = !this.searchTerm || 
          log.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(this.searchTerm.toLowerCase());
          
        const matchesCategory = this.selectedCategory === 'ALL' || log.category === this.selectedCategory;
        const matchesSeverity = this.selectedSeverity === 'ALL' || log.severity === this.selectedSeverity;
        
        return matchesSearch && matchesCategory && matchesSeverity;
      }))
    );
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-error/10 text-error border-error/20';
      case 'WARNING': return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case AuditCategory.SECURITY: return 'shield_lock';
      case AuditCategory.MEDICAL: return 'medical_services';
      case AuditCategory.BILLING: return 'payments';
      default: return 'settings';
    }
  }

  exportLogs() {
    this.logs$.pipe(map(logs => {
      const header = 'ID,Date,Utilisateur,Action,Categorie,Details,Severite\n';
      const rows = logs.map(l => 
        `"${l.id}","${new Date(l.timestamp).toLocaleString()}","${l.userName}","${l.action}","${l.category}","${l.details.replace(/"/g, '""')}","${l.severity}"`
      ).join('\n');
      
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `medconnect_audit_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    })).subscribe().unsubscribe();
  }
}


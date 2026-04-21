import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/views/login/login.component';
import { DashboardComponent } from './components/views/dashboard/dashboard.component';
import { PatientsComponent } from './components/views/patients/patients.component';
import { AdminComponent } from './components/views/admin/admin.component';
import { AppLayoutComponent } from './components/layout/app-layout/app-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { SetupGuard } from './guards/setup.guard';
import { UserRole } from './models/user.model';

import { SetupWizardComponent } from './components/views/setup-wizard/setup-wizard.component';
import { CalendarComponent } from './components/views/calendar/calendar.component';
import { MedicalRecordDetailComponent } from './components/views/patients/medical-record-detail/medical-record-detail.component';
import { PrescriptionComponent } from './components/views/patients/prescription/prescription.component';
import { HelpComponent } from './components/views/help/help.component';
import { PerformanceComponent } from './components/views/performance/performance.component';
import { BillingComponent } from './components/views/billing/billing.component';
import { TraceabilityComponent } from './components/views/traceability/traceability.component';
import { NotFoundComponent } from './components/views/not-found/not-found.component';

import { SettingsComponent } from './components/views/settings/settings.component';

const routes: Routes = [
  { path: 'setup', component: SetupWizardComponent },
  { path: 'login', component: LoginComponent, canActivate: [SetupGuard] },
  { path: 'help', component: HelpComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [SetupGuard, AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'patients', 
        component: PatientsComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      { 
        path: 'patients/:id/record', 
        component: MedicalRecordDetailComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR] }
      },
      { 
        path: 'patients/:id/prescription', 
        component: PrescriptionComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR] }
      },
      { 
        path: 'admin', 
        component: AdminComponent, 
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } 
      },
      { 
        path: 'settings', 
        component: SettingsComponent, 
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } 
      },
      { 
        path: 'performance', 
        component: PerformanceComponent, 
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } 
      },
      { 
        path: 'billing', 
        component: BillingComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECRETARY] }
      },
      { path: 'calendar', component: CalendarComponent },
      { 
        path: 'records', 
        component: PatientsComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR] }
      },
      {
        path: 'traceability',
        component: TraceabilityComponent,
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      }
    ]
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/views/login/login.component';
import { DashboardComponent } from './components/views/dashboard/dashboard.component';
import { PatientsComponent } from './components/views/patients/patients.component';
import { AdminComponent } from './components/views/admin/admin.component';
import { AppLayoutComponent } from './components/layout/app-layout/app-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { UserRole } from './models/user.model';

import { CalendarComponent } from './components/views/calendar/calendar.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsComponent },
      { 
        path: 'admin', 
        component: AdminComponent, 
        data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } 
      },
      { path: 'calendar', component: CalendarComponent },
      { path: 'records', component: PatientsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

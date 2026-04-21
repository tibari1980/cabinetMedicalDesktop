import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { AppComponent } from './app.component';

// Layout Components
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { AppLayoutComponent } from './components/layout/app-layout/app-layout.component';

// View Components
import { LoginComponent } from './components/views/login/login.component';
import { DashboardComponent } from './components/views/dashboard/dashboard.component';
import { PatientsComponent } from './components/views/patients/patients.component';
import { AdminComponent } from './components/views/admin/admin.component';
import { CalendarComponent } from './components/views/calendar/calendar.component';
import { MedicalRecordDetailComponent } from './components/views/patients/medical-record-detail/medical-record-detail.component';
import { PrescriptionComponent } from './components/views/patients/prescription/prescription.component';
import { HelpComponent } from './components/views/help/help.component';
import { PerformanceComponent } from './components/views/performance/performance.component';
import { BillingComponent } from './components/views/billing/billing.component';
import { TraceabilityComponent } from './components/views/traceability/traceability.component';
import { NotFoundComponent } from './components/views/not-found/not-found.component';
import { SettingsComponent } from './components/views/settings/settings.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    AppLayoutComponent,
    LoginComponent,
    DashboardComponent,
    PatientsComponent,
    AdminComponent,
    CalendarComponent,
    MedicalRecordDetailComponent,
    PrescriptionComponent,
    HelpComponent,
    PerformanceComponent,
    BillingComponent,
    TraceabilityComponent,
    NotFoundComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

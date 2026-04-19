import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
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
    CalendarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  patients: Patient[] = [];
  today = new Date();

  constructor(
    private patientService: PatientService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.patientService.getPatients().subscribe(data => {
      this.patients = data;
    });
  }
}

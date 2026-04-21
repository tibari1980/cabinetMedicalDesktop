import { Injectable } from '@angular/core';
import { PatientService } from './patient.service';
import { MedicalRecordService } from './medical-record.service';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  constructor(
    private patientService: PatientService,
    private medicalRecordService: MedicalRecordService
  ) {}

  async seedPatients(count: number = 50) {
    const firstNames = ['Mohamed', 'Fatima', 'Jean', 'Sophie', 'Carlos', 'Elena', 'Yassine', 'Inès', 'Lucas', 'Emma'];
    const lastNames = ['Bennani', 'Dupont', 'Garcia', 'Rossi', 'Silva', 'Muller', 'Alami', 'Chen', 'Doe', 'Smith'];
    
    console.log(`⚡ Démarrage du seeding de ${count} patients...`);
    
    for (let i = 0; i < count; i++) {
      const id = Date.now() + i;
      const patient: Patient = {
        id: id,
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        email: `patient${i}@example.com`,
        phone: `+212 6${Math.floor(10000000 + Math.random() * 90000000)}`,
        birthDate: '1990-01-01',
        gender: Math.random() > 0.5 ? 'Masculin' : 'Féminin',
        address: 'Rue de la Liberté, Cabinet Test',
        lastVisit: new Date().toISOString()
      };
      
      await this.patientService.addPatient(patient);
      await this.medicalRecordService.initializeRecord(id.toString());
    }
    
    console.log('✅ Seeding terminé avec succès !');
  }
}

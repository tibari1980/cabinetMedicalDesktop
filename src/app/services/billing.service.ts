import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { ClinicService } from './clinic.service';
import { Appointment } from '../models/appointment.model';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { AuditAction, AuditCategory } from '../models/audit.model';

import { DatabaseService } from './database.service';
import { PatientService } from './patient.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  public invoices$ = this.invoicesSubject.asObservable();

  constructor(
    private clinicService: ClinicService,
    private auditService: AuditService,
    private authService: AuthService,
    private dbService: DatabaseService,
    private patientService: PatientService
  ) {
    this.loadInvoices();
  }

  private async loadInvoices() {
    // Migration logic from localStorage if found
    const saved = localStorage.getItem('mf_invoices');
    let invoices: Invoice[] = [];
    
    if (saved) {
      invoices = JSON.parse(saved);
      // Migrate to IndexedDB
      await this.dbService.putAll('invoices', invoices);
      localStorage.removeItem('mf_invoices');
    } else {
      // Create 'invoices' store if it doesn't exist in init() - done in database.service already? 
      // I should update database.service to include invoices store.
      invoices = await this.dbService.getAll<Invoice>('invoices');
    }
    
    this.invoicesSubject.next(invoices);
  }

  getInvoices(): Invoice[] {
    return this.invoicesSubject.value;
  }

  async generateInvoiceFromAppointment(apt: Appointment, patientAddress: string = ''): Promise<Invoice> {
    const invoices = this.getInvoices();
    
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.id.includes(year.toString())).length + 1;
    const invoiceId = `FA-${year}-${count.toString().padStart(4, '0')}`;

    const clinic = this.clinicService.getClinicValue();
    const taxRate = clinic.taxTvaRate || 0;
    
    const totalTTC = apt.fee || 0;
    const amountModifier = Number((totalTTC / (1 + (taxRate / 100))).toFixed(2));

    const patient = await firstValueFrom(this.patientService.getPatientById(apt.patientId));

    const newInvoice: Invoice = {
      id: invoiceId,
      date: new Date().toISOString(),
      patientId: apt.patientId,
      patientName: apt.patientName,
      patientAddress: patient?.address || patientAddress,
      patientPhone: patient?.phone,
      patientEmail: patient?.email,
      patientBirthDate: patient?.birthDate,
      appointmentId: apt.id.toString(),
      amountModifier: amountModifier,
      taxRate: taxRate,
      totalTTC: totalTTC,
      status: 'PENDING',
      description: `Consultation médicale du ${apt.date}`
    };

    // Save to IndexedDB
    await this.dbService.put('invoices', newInvoice);
    
    const updatedInvoices = [newInvoice, ...invoices];
    this.invoicesSubject.next(updatedInvoices);

    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.CREATE_BILLING,
      `Facture générée : ${newInvoice.id} pour ${newInvoice.patientName} (${newInvoice.totalTTC} DH)`,
      AuditCategory.BILLING,
      'INFO'
    );

    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']) {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(i => i.id === id);
    if (index > -1) {
      invoices[index].status = status;
      await this.dbService.put('invoices', invoices[index]);
      this.invoicesSubject.next([...invoices]);

      if (status === 'PAID') {
        this.auditService.log(
          this.authService.currentUserValue,
          AuditAction.COLLECT_PAYMENT,
          `Paiement encaissé (Facture ${id})`,
          AuditCategory.BILLING,
          'INFO'
        );
      }
    }
  }

  async deleteInvoice(id: string) {
    await this.dbService.delete('invoices', id);
    const invoices = this.getInvoices().filter(i => i.id !== id);
    this.invoicesSubject.next(invoices);
    
    this.auditService.log(
      this.authService.currentUserValue,
      AuditAction.DELETE_BILLING,
      `Facture supprimée : ${id}`,
      AuditCategory.BILLING,
      'WARNING'
    );
  }
}

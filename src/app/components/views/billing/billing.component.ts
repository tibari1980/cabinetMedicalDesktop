import { Component, OnInit } from '@angular/core';
import { BillingService } from '../../../services/billing.service';
import { Invoice } from '../../../models/invoice.model';
import { ClinicService } from '../../../services/clinic.service';
import { ClinicInfo } from '../../../models/clinic.model';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html'
})
export class BillingComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  searchTerm: string = '';
  selectedInvoice: Invoice | null = null;
  clinic!: ClinicInfo;

  constructor(
    private billingService: BillingService,
    private clinicService: ClinicService
  ) {}

  ngOnInit() {
    this.clinic = this.clinicService.getClinicValue();
    this.billingService.invoices$.subscribe(data => {
      this.invoices = data;
      this.applyFilter();
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredInvoices = this.invoices;
      return;
    }

    this.filteredInvoices = this.invoices.filter(inv =>
      inv.id.toLowerCase().includes(term) ||
      inv.patientName.toLowerCase().includes(term) ||
      inv.totalTTC.toString().includes(term)
    );
  }

  viewInvoice(inv: Invoice) {
    this.selectedInvoice = inv;
  }

  closeInvoice() {
    this.selectedInvoice = null;
  }

  printInvoice() {
    window.print();
  }

  deleteInvoice(id: string) {
    if(confirm('Êtes-vous sûr de vouloir supprimer cette facture (Action IRRÉVERSIBLE) ?')) {
      this.billingService.deleteInvoice(id);
      this.selectedInvoice = null;
    }
  }

  get tvaAmount(): number {
    if(!this.selectedInvoice) return 0;
    return this.selectedInvoice.totalTTC - this.selectedInvoice.amountModifier;
  }
}

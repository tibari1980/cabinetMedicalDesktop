import { Component, OnInit } from '@angular/core';
import { BillingService } from '../../../services/billing.service';
import { Invoice } from '../../../models/invoice.model';
import { ClinicService } from '../../../services/clinic.service';
import { ClinicInfo } from '../../../models/clinic.model';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

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
    private clinicService: ClinicService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  public UserRole = UserRole;

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
    if (this.selectedInvoice) {
      const originalTitle = document.title;
      document.title = `${this.selectedInvoice.id}_${this.selectedInvoice.patientName.replace(/\s+/g, '_')}`;
      window.print();
      document.title = originalTitle;
    } else {
      window.print();
    }
  }

  downloadPDF(inv: Invoice) {
    this.selectedInvoice = inv;
    // Petit delai pour laisser le template s'afficher avant de lancer l'impression
    setTimeout(() => {
      this.printInvoice();
    }, 100);
  }

  async markAsPaid(inv: Invoice) {
    this.notificationService.confirm(
      'NOTIFICATIONS.PAYMENT_SUCCESS', // On réutilise le message pour la confirmation d'encaissement ? Peut être mieux un message de confirmation
      () => {
        this.billingService.updateInvoiceStatus(inv.id, 'PAID');
        this.notificationService.success('NOTIFICATIONS.PAYMENT_SUCCESS', 'BILLING.DOC_TITLE');
      },
      { title: 'BILLING.MARK_AS_PAID', params: { name: inv.id } }
    );
  }

  deleteInvoice(id: string) {
    this.notificationService.confirm(
      'NOTIFICATIONS.DELETE_CONFIRM',
      () => {
        this.billingService.deleteInvoice(id);
        this.selectedInvoice = null;
      },
      { title: 'BILLING.HISTORY', params: { name: id } }
    );
  }

  get tvaAmount(): number {
    if(!this.selectedInvoice) return 0;
    return this.selectedInvoice.totalTTC - this.selectedInvoice.amountModifier;
  }
}

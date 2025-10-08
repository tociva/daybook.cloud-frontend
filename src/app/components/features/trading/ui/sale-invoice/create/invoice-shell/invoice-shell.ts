import { Component, computed, inject } from '@angular/core';
import { InvoiceCustomer } from '../invoice-customer/invoice-customer';
import { InvoiceItems } from '../invoice-items/invoice-items';
import { InvoiceProperties } from '../invoice-properties/invoice-properties';
import { InvoiceSummary } from '../invoice-summary/invoice-summary';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoice-shell',
  imports: [ReactiveFormsModule, InvoiceCustomer, InvoiceProperties, InvoiceItems, InvoiceSummary],
  templateUrl: './invoice-shell.html',
  styleUrl: './invoice-shell.css'
})
export class InvoiceShell {

  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService);
  
  readonly form = this.saleInvoiceFormService.createSaleInvoiceForm();

  readonly customerGroup = computed(() => this.form.get('customer') as FormGroup);

  onSubmit() {
    console.log(this.form.value);
  }
}

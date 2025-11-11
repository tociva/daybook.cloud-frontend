import { Component, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { PurchaseInvoice } from '../../../../store/purchase-invoice/purchase-invoice.model';
import { purchaseInvoiceActions } from '../../../../store/purchase-invoice/purchase-invoice.actions';
import { PurchaseInvoiceStore } from '../../../../store/purchase-invoice/purchase-invoice.store';
import { PurchaseReturnPurchaseInvoiceForm } from '../../util/purchase-return-form.type';

@Component({
  selector: 'app-purchase-return-purchase-invoice',
  imports: [ReactiveFormsModule, AutoComplete, NgIcon],
  templateUrl: './purchase-return-purchase-invoice.html',
  styleUrl: './purchase-return-purchase-invoice.css'
})
export class PurchaseReturnPurchaseInvoice {

  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly form = input.required<FormGroup<PurchaseReturnPurchaseInvoiceForm>>();

  readonly purchaseInvoices = this.purchaseInvoiceStore.items;

  findPurchaseInvoiceDisplayValue = (purchaseInvoice: PurchaseInvoice) => purchaseInvoice?.number ?? '';

  onPurchaseInvoiceSearch(value: string) {
    this.store.dispatch(purchaseInvoiceActions.loadPurchaseInvoices({ query: { search: [{query: value, fields: ['number', 'description']}], includes: ['vendor', 'currency'] } }));
  }

  onNewPurchaseInvoice() {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/purchase-invoice/create'], { queryParams: { burl } });
  }
}


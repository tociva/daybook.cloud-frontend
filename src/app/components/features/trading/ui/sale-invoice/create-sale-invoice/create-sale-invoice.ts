import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { TextInputDirective } from '../../../../../../util/directives/text-input-directive';
import { AutoComplete } from '../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../shared/dbc-address-form/dbc-address-form';
import { DbcSwitch } from '../../../../../shared/dbc-switch/dbc-switch';
import { currencyActions } from '../../../../../shared/store/currency/currency.action';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { Customer, customerActions, CustomerStore } from '../../../store/customer';
import { SaleInvoiceFormService } from '../util/sale-invoice-form.service';
import { SaleInvoiceForm } from '../util/sale-invoice-form.type';
import { Item, itemActions, ItemStore } from '../../../store/item';
import { taxGroupActions, TaxGroupModeStore } from '../../../store/tax-group';

@Component({
  selector: 'app-create-sale-in voice',
  imports: [ReactiveFormsModule, AutoComplete, NgIconComponent, DbcAddressForm, DbcSwitch, TextInputDirective,],
  templateUrl: './create-sale-invoice.html',
  styleUrl: './create-sale-invoice.css'
})
export class CreateSaleInvoice {

  private formSvc = inject(SaleInvoiceFormService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  readonly customerStore = inject(CustomerStore);
  readonly currencyStore = inject(CurrencyStore);
  readonly itemStore = inject(ItemStore);
  readonly taxGroupModeStore = inject(TaxGroupModeStore);
  readonly customers = this.customerStore.items;
  readonly items = this.itemStore.items;
  currencies = signal<Currency[]>([]);
  modes = this.taxGroupModeStore.items;
  filteredModes = signal<string[]>([]);

  readonly form:  FormGroup<SaleInvoiceForm> = this.formSvc.createForm({
    billingaddressreadonly: true,
    shippingaddressreadonly: true,
    useBillingForShipping: true,
    autoNumbering: true,
    showDescription: false,
    showDiscount: true,
    taxOption: '',
  }); 

  useBillingForShippingSig = toSignal(
    this.form.controls.useBillingForShipping.valueChanges,
    { initialValue: this.form.controls.useBillingForShipping.value }
  );

  billingAddressSig = toSignal(
    this.form.controls.billingaddress.valueChanges,
    { initialValue: this.form.controls.billingaddress.value }
  );

  autoNumbering = toSignal(
    this.form.controls.autoNumbering.valueChanges,
    { initialValue: this.form.controls.autoNumbering.value }
  );

  constructor() {

    effect(() => {
      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
      }else{
        this.store.dispatch(currencyActions.loadCurrencies({query: {}}));
      }
    });

    effect(() => {
      const isSameAsBilling = this.useBillingForShippingSig();
      if(isSameAsBilling) {
        this.form.patchValue({ shippingaddress: this.form.controls.billingaddress.value });
      }
    });

    effect(() => {
      const billingAddress = this.billingAddressSig();
      if(billingAddress && this.form.controls.useBillingForShipping.value) {
        this.form.patchValue({ shippingaddress: billingAddress});
      }
    });

    effect(() => {
      if(this.autoNumbering()) {
        this.form.patchValue({ number: '' });
        this.form.controls.number.disable();
      } else {
        this.form.controls.number.enable();
      }
    });

  }

  ngOnInit() {
    this.store.dispatch(taxGroupActions.loadTaxGroupModes({}));
  }
  
  findCustomerDisplayValue = (customer: Customer) => customer?.name ?? '';

  findItemDisplayValue = (item: Item) => {
    const name = item?.displayname ?? item?.name ?? '';
    if(item.code) {
      return `${name} (${item.code})`;
    }
    return name;
  }
  findItemOptionDisplayValue = (item: Item) => {
    const name = item?.name ?? item?.displayname ?? '';
    if(item.code) {
      return `${name} (${item.code})`;
    }
    return name;
  }

  onCustomerSearch(value: string) {
    this.store.dispatch(customerActions.loadCustomers({ query: { search: { query: value, fields: ['name', 'mobile', 'description','email'] }, includes: ['currency'] } }));
  }

  onCustomerSelected(customer: Customer) {
    this.form.patchValue({ billingaddress: customer.address });
    if(this.form.controls.useBillingForShipping.value) {
      this.form.patchValue({ shippingaddress: customer.address });
    }
    this.form.patchValue({ customer: customer });
    this.form.patchValue({ deliveryState: customer.state });
    this.form.patchValue({ currency: customer.currency });
  }

  onNewCustomer() {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/customer/create'], { queryParams: { burl } });
  }

  onEditBillingAddress() {
    this.form.patchValue({ billingaddressreadonly: !this.form.controls.billingaddressreadonly.value });
  }

  onEditShippingAddress() {
    this.form.patchValue({ shippingaddressreadonly: !this.form.controls.shippingaddressreadonly.value });
  }

  onCurrencySearch(value: string) {
    this.currencyStore.setSearch(value);
  }

  onCurrencySelected(currency: Currency) {
    this.form.patchValue({ currency: currency });
  }

  findCurrencyDisplayValue(currency: Currency) {
    return `${currency.symbol} ${currency.name}`;
  }

  onTaxOptionSearch(value: string) {
    this.filteredModes.set(this.modes().filter(option => option.toLowerCase().includes(value.toLowerCase())));
  }

  onTaxOptionSelected(taxOption: string) {
    this.form.patchValue({ taxOption: taxOption });
  }

  addItemRow() {
    this.formSvc.addEmptyItemRow(this.form.controls.items);
  }

  removeItemRow(index: number) {
    this.form.controls.items.removeAt(index);
  }

  onItemChanged() {
    this.form.controls.items.updateValueAndValidity();
  }

  onItemSearch = (value: string) => {
    this.store.dispatch(itemActions.loadItems({ query: { search: { query: value, fields: ['name', 'code', 'description', 'displayname', 'barcode'] } } }));
  }

  onItemSelected = (index: number) => (item: Item) => {
    this.form.controls.items.at(index).patchValue({ item, code: item.code, name: item.name });
  };
  
}

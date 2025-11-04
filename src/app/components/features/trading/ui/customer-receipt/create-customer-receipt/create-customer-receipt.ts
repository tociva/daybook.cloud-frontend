import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { tap } from 'rxjs';
import { buildFormKey, sanitizeQuery } from '../../../../../../util/common.util';
import { DEFAULT_DATE_FORMAT, DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';
import { formatAmountToFraction, toNumber } from '../../../../../../util/currency.util';
import { NumberInputDirective } from '../../../../../../util/directives/number-input.directive';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { LB4Search } from '../../../../../../util/query-params-util';
import { UserSessionStore } from '../../../../../core/auth/store/user-session/user-session.store';
import { AutoComplete } from '../../../../../shared/auto-complete/auto-complete';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { currencyActions } from '../../../../../shared/store/currency/currency.action';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { bankCashActions, BankCashStore } from '../../../store/bank-cash';
import { BankCash } from '../../../store/bank-cash/bank-cash.model';
import { customerActions, CustomerStore } from '../../../store/customer';
import { customerReceiptActions, CustomerReceiptStore } from '../../../store/customer-receipt';
import { CustomerReceipt } from '../../../store/customer-receipt/customer-receipt.model';
import { Customer } from '../../../store/customer/customer.model';
import { saleInvoiceActions } from '../../../store/sale-invoice/sale-invoice.actions';
import { SaleInvoice } from '../../../store/sale-invoice/sale-invoice.model';
import { SaleInvoiceStore } from '../../../store/sale-invoice/sale-invoice.store';
import { CustomerReceiptRequest } from '../customer-receipt.util';

interface InvoiceFormValue {
  invoice: SaleInvoice | null;
  amount: number | null;
}
interface InvoiceForm {
  invoice: FormControl<SaleInvoice | null>;
  amount: FormControl<number | null>;
}
interface CustomerReceiptFormValue { 
  rcptdate: string | null;
  customer: Customer | null;
  amount: number | null;
  currency: Currency | null;
  bcash: BankCash | null;
  description?: string | null;
  invoices?: Array<InvoiceFormValue>;
}
interface CustomerReceiptForm {
  rcptdate: FormControl<string | null>;
  customer: FormControl<Customer | null>;
  amount: FormControl<number | null>;
  currency: FormControl<Currency | null>;
  bcash: FormControl<BankCash | null>;
  description?: FormControl<string | null>;
  invoices: FormArray<FormGroup<InvoiceForm>>;
}
@Component({
  selector: 'app-create-customer-receipt',
  imports: [ReactiveFormsModule, NgClass, AutoComplete, CancelButton, SkeltonLoader, ItemNotFound, NgIcon, NumberInputDirective],
  templateUrl: './create-customer-receipt.html',
  styleUrl: './create-customer-receipt.css'
})
export class CreateCustomerReceipt extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_CUSTOMER_RECEIPT';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  readonly customerReceiptStore = inject(CustomerReceiptStore);
  readonly customerStore = inject(CustomerStore);
  readonly bankCashStore = inject(BankCashStore);
  readonly currencyStore = inject(CurrencyStore);
  readonly userSessionStore = inject(UserSessionStore);
  readonly selectedCustomerReceipt = this.customerReceiptStore.selectedItem;

  private readonly saleInvoiceStore = inject(SaleInvoiceStore);
  readonly saleInvoices = this.saleInvoiceStore.items;

  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('customer-receipt', this.mode(), this.itemId()));
  readonly submitting = signal(false);
  
  readonly customers = this.customerStore.items;
  readonly bankCashAccounts = this.bankCashStore.items;
  currencies = signal<Currency[]>([]);
  filteredCustomers = signal<Customer[]>([]);
  filteredCurrencies = signal<Currency[]>([]);
  filteredBankCashes = signal<BankCash[]>([]);

  readonly form = this.fb.group<CustomerReceiptForm>({
    rcptdate: new FormControl<string | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    customer: new FormControl<Customer | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
      nonNullable: false,
    }),
    currency: new FormControl<Currency | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    bcash: new FormControl<BankCash | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    description: new FormControl<string | null>(null),
    invoices: new FormArray<FormGroup<{
      invoice: FormControl<SaleInvoice | null>;
      amount: FormControl<number | null>;
    }>>([this.buildInvoiceForm()]),
  });

  readonly title = signal('Customer Receipt Setup');

  private buildInvoiceForm(seed?: InvoiceFormValue): FormGroup<InvoiceForm> {
    return this.fb.group<InvoiceForm>({
      invoice: new FormControl<SaleInvoice | null>(seed?.invoice ?? null, { nonNullable: false }),
      amount: new FormControl<number | null>(seed?.amount ?? null, { nonNullable: false }),
    });  
  }


  constructor() {
    super();
    effect(() => {
      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
        this.filteredCurrencies.set(this.currencyStore.filteredCurrencies());
      }else{
        this.store.dispatch(currencyActions.loadCurrencies({query: {}}));
      }
    });

    effect(() => {
      // Watch for changes to filtered currencies from the store
      this.filteredCurrencies.set(this.currencyStore.filteredCurrencies());
    });

    effect(() => {
      this.filteredCustomers.set(this.customers());
    });

    effect(() => {
      this.filteredBankCashes.set(this.bankCashAccounts());
    });

    this.binder = this.bindFormToDraft<CustomerReceipt>(
      this.form,
      this.formKey,
      {
        selected: this.selectedCustomerReceipt,
        persistIf: (form, v) => form.dirty && !!v,
      }
    );
  }

  private binder: { clear: () => void };

  private fillFormEffect = effect(() => {
    const customerReceipt = this.selectedCustomerReceipt();
    if (customerReceipt) {
      // Format date for input
      const dateValue = dayjs(customerReceipt.date).format(DEFAULT_NODE_DATE_FORMAT);
      this.form.patchValue({
        ...customerReceipt,
        rcptdate: dateValue,
      });
      if(customerReceipt.invoices?.length) {
        this.invoices.clear();
        customerReceipt.invoices.forEach(invoice => {
          const saleInvoice = invoice.saleinvoice;
          if(saleInvoice) {
            this.invoices.push(this.buildInvoiceForm({
              invoice: saleInvoice,
              amount: invoice.amount,
            }));
          }
        });
      }
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.customerReceiptStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  readonly createSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(customerReceiptActions.createCustomerReceiptSuccess),
      tap(() => {
        this.submitting.set(false);
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly createFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(customerReceiptActions.createCustomerReceiptFailure),
      tap(() => {
        this.submitting.set(false);
        this.customerReceiptStore.setError(null);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(customerReceiptActions.updateCustomerReceiptSuccess),
      tap(() => {
        this.submitting.set(false);
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(customerReceiptActions.updateCustomerReceiptFailure),
      tap(() => {
        this.submitting.set(false);
        this.customerReceiptStore.setError(null);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  private goBack = () => {
    const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/app/trading/customer-receipt';
    this.router.navigateByUrl(burl);
  }

  get invoices(): FormArray<FormGroup<InvoiceForm>> {
    return this.form.controls.invoices;
  }

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(customerReceiptActions.loadCustomerReceiptById({ id: this.itemId()!, query: { includes: 
          ['customer', 'currency', 'bcash', 'invoices.saleinvoice'] } }));
      }else{
        this.loading = false;
      }
    }
    
    // Load initial data for autocomplete fields
    this.store.dispatch(customerActions.loadCustomers({ query: { limit: 20 } }));
    this.store.dispatch(bankCashActions.loadBankCashes({ query: { limit: 20 } }));
  }

  ngOnDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
    this.createSuccessEffect.destroy();
    this.createFailureEffect.destroy();
    this.updateSuccessEffect.destroy();
    this.updateFailureEffect.destroy();
  }

  findInvoiceDisplayValue = (invoice: SaleInvoice): string => {
    const branch = this.userSessionStore.branch();
    const customer = this.form.get('customer')?.value as Customer;
    const formCurrency = this.form.get('currency')?.value as Currency;
    const currency = formCurrency ??invoice.currency ?? customer?.currency;
    const fraction = currency?.minorunit ?? 2;
    const dateFormat = branch?.dateformat ?? DEFAULT_DATE_FORMAT;
    const amount = `${currency?.symbol ?? ''} ${formatAmountToFraction(invoice.grandtotal ?? 0, fraction)}`;
    return `${invoice.number} dated ${dayjs(invoice.date).format(dateFormat)} of amount ${amount}`;
  };

  onInvoiceSearch(value: string): void {
    const customer = this.form.get('customer')?.value as Customer;
    const search:LB4Search[] = [{query: value, fields: ['number']}];
    if(customer?.id) {
      search.push({query: customer.id, fields: ['customerid']});
    }
    this.store.dispatch(saleInvoiceActions.loadSaleInvoices({ query: { search: search } }));
  }

  onRemoveInvoice(index: number): void {
    this.invoices.removeAt(index);
    this.form.markAsDirty();
    if(this.invoices.length === 0) {
      this.onAddInvoice();
    }
  }

  onAddInvoice(): void {
    const invForm = this.buildInvoiceForm();
    this.invoices.push(invForm);
  }

  // Customer autocomplete methods
  onCustomerSearch(value: string): void {
    this.store.dispatch(customerActions.loadCustomers({ query: { search: [{query: value, fields: ['name', 'mobile', 'email']}], includes: ['currency'] } }));
  }

  findCustomerDisplayValue(customer: Customer): string {
    return customer.name;
  }

  findCustomerInputDisplayValue(customer: Customer): string {
    return customer.name;
  }

  onCustomerSelected(customer: Customer): void {
    if(customer?.currency) {
      this.form.patchValue({ currency: customer.currency });
      this.invoices.clear();
      this.onAddInvoice();
    }
  }

  // Currency autocomplete methods
  onCurrencySearch(value: string): void {
    const sanitized = sanitizeQuery(value);
    this.currencyStore.setSearch(sanitized);
    this.filteredCurrencies.set(this.currencyStore.filteredCurrencies());
  }

  findCurrencyDisplayValue(currency: Currency): string {
    return `${currency.symbol} ${currency.name}`;
  }

  findCurrencyInputDisplayValue(currency: Currency): string {
    return `${currency.symbol} ${currency.name}`;
  }

  // Bank/Cash autocomplete methods
  onBankCashSearch(value: string): void {
    this.store.dispatch(bankCashActions.loadBankCashes({ query: { search: [{query: value, fields: ['name', 'description']}] } }));
  }

  findBankCashDisplayValue(bcash: BankCash): string {
    return bcash.name;
  }

  findBankCashInputDisplayValue(bcash: BankCash): string {
    return bcash.name;
  }

  handleSubmit(): void {
    if (this.submitting()) return;
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.value as CustomerReceiptFormValue;
    const { customer, currency, bcash, description, amount, rcptdate } = formData;

    if (!rcptdate || !customer || !currency || !bcash || !amount) {
      this.submitting.set(false);
      return;
    }

    const customerReceipt: CustomerReceiptRequest = {
      date: new Date(rcptdate as string),
      amount: toNumber(amount),
      customerid: customer.id!,
      currencycode: currency.code,
      bcashid: bcash.id!,
      ...(description && { description }),
    };

    if(this.invoices.length > 0) {
      customerReceipt.invoices = this.invoices.value.map(invoice => ({
        saleinvoiceid: invoice.invoice!.id!,
        amount: toNumber(invoice.amount!),
      }));
    }
    if(this.mode() === 'create') {
      this.draftStore.setOneTimeDraft(CreateCustomerReceipt.ONE_TIME_DRAFT_KEY, customerReceipt);
      this.store.dispatch(customerReceiptActions.createCustomerReceipt({ customerReceipt }));
    }else{
      this.store.dispatch(customerReceiptActions.updateCustomerReceipt({ id: this.itemId()!, customerReceipt }));
    }
    this.binder.clear();
  }
}


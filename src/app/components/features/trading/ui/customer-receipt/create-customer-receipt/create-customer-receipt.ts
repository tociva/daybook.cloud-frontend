import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';
import { buildFormKey, sanitizeQuery } from '../../../../../../util/common.util';
import { toNumber } from '../../../../../../util/currency.util';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
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
import { CustomerReceipt, CustomerReceiptCU } from '../../../store/customer-receipt/customer-receipt.model';
import { Customer } from '../../../store/customer/customer.model';

interface InvoiceFormValue {
  invoiceid: string | null;
  amount: number | null;
}
interface InvoiceForm {
  invoiceid: FormControl<string | null>;
  amount: FormControl<number | null>;
}
interface CustomerReceiptFormValue { 
  date: string | null;
  customer: Customer | null;
  amount: number | null;
  currency: Currency | null;
  bcash: BankCash | null;
  description?: string | null;
  invoices?: Array<InvoiceFormValue>;
}
interface CustomerReceiptForm {
  date: FormControl<string | null>;
  customer: FormControl<Customer | null>;
  amount: FormControl<number | null>;
  currency: FormControl<Currency | null>;
  bcash: FormControl<BankCash | null>;
  description?: FormControl<string | null>;
  invoices: FormArray<FormGroup<InvoiceForm>>;
}
@Component({
  selector: 'app-create-customer-receipt',
  imports: [ReactiveFormsModule, NgClass, AutoComplete, CancelButton, SkeltonLoader, ItemNotFound],
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
  readonly selectedCustomerReceipt = this.customerReceiptStore.selectedItem;
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

  readonly form: FormGroup<CustomerReceiptForm>;

  readonly title = signal('Customer Receipt Setup');

  private buildInvoiceForm(seed?: InvoiceFormValue): FormGroup<InvoiceForm> {
    return this.fb.group<InvoiceForm>({
      invoiceid: new FormControl<string | null>(seed?.invoiceid ?? null, { nonNullable: false }),
      amount: new FormControl<number | null>(seed?.amount ?? null, { nonNullable: false }),
    });  
  }

  constructor() {
    super();
    this.form = this.fb.group<CustomerReceiptForm>({
      date: new FormControl<string | null>(null, {
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
        invoiceid: FormControl<string | null>;
        amount: FormControl<number | null>;
      }>>([this.buildInvoiceForm()]),
    });

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
      const dateValue = customerReceipt.date ? new Date(customerReceipt.date).toISOString().split('T')[0] : null;
      this.form.patchValue({
        ...customerReceipt,
        date: dateValue,
      });
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

  get invoices(): FormArray<FormGroup<{
    invoiceid: FormControl<string | null>;
    amount: FormControl<number | null>;
  }>> {
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
        this.store.dispatch(customerReceiptActions.loadCustomerReceiptById({ id: this.itemId()!, query: { includes: ['customer', 'currency', 'bcash'] } }));
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

  handleSubmit(): void {
    if (this.submitting()) return;
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.value as CustomerReceiptFormValue;
    const { customer, currency, bcash, description, amount, date } = formData;

    if (!date || !customer || !currency || !bcash || !amount) {
      this.submitting.set(false);
      return;
    }

    const customerReceipt: CustomerReceiptCU = {
      date: new Date(date),
      amount: toNumber(amount),
      customerid: customer.id!,
      currencycode: currency.code,
      bcashid: bcash.id!,
      ...(description && { description }),
    };
    
    if(this.mode() === 'create') {
      this.draftStore.setOneTimeDraft(CreateCustomerReceipt.ONE_TIME_DRAFT_KEY, customerReceipt);
      this.store.dispatch(customerReceiptActions.createCustomerReceipt({ customerReceipt }));
    }else{
      this.store.dispatch(customerReceiptActions.updateCustomerReceipt({ id: this.itemId()!, customerReceipt }));
    }
    this.binder.clear();
  }

  // Customer autocomplete methods
  onCustomerSearch(value: string): void {
    this.store.dispatch(customerActions.loadCustomers({ query: { search: { query: value, fields: ['name', 'mobile', 'email'] } } }));
  }

  findCustomerDisplayValue(customer: Customer): string {
    return customer.name;
  }

  findCustomerInputDisplayValue(customer: Customer): string {
    return customer.name;
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
    this.store.dispatch(bankCashActions.loadBankCashes({ query: { search: { query: value, fields: ['name', 'description'] } } }));
  }

  findBankCashDisplayValue(bcash: BankCash): string {
    return bcash.name;
  }

  findBankCashInputDisplayValue(bcash: BankCash): string {
    return bcash.name;
  }
}


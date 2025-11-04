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
import { vendorActions, VendorStore } from '../../../store/vendor';
import { vendorPaymentActions, VendorPaymentStore } from '../../../store/vendor-payment';
import { VendorPayment } from '../../../store/vendor-payment/vendor-payment.model';
import { Vendor } from '../../../store/vendor/vendor.model';
import { purchaseInvoiceActions } from '../../../store/purchase-invoice/purchase-invoice.actions';
import { PurchaseInvoice } from '../../../store/purchase-invoice/purchase-invoice.model';
import { PurchaseInvoiceStore } from '../../../store/purchase-invoice/purchase-invoice.store';
import { VendorPaymentRequest } from '../vendor-payment.util';

interface InvoiceFormValue {
  invoice: PurchaseInvoice | null;
  amount: number | null;
}
interface InvoiceForm {
  invoice: FormControl<PurchaseInvoice | null>;
  amount: FormControl<number | null>;
}
interface VendorPaymentFormValue { 
  pmtdate: string | null;
  vendor: Vendor | null;
  amount: number | null;
  currency: Currency | null;
  bcash: BankCash | null;
  description?: string | null;
  invoices?: Array<InvoiceFormValue>;
}
interface VendorPaymentForm {
  pmtdate: FormControl<string | null>;
  vendor: FormControl<Vendor | null>;
  amount: FormControl<number | null>;
  currency: FormControl<Currency | null>;
  bcash: FormControl<BankCash | null>;
  description?: FormControl<string | null>;
  invoices: FormArray<FormGroup<InvoiceForm>>;
}
@Component({
  selector: 'app-create-vendor-payment',
  imports: [ReactiveFormsModule, NgClass, AutoComplete, CancelButton, SkeltonLoader, ItemNotFound, NgIcon, NumberInputDirective],
  templateUrl: './create-vendor-payment.html',
  styleUrl: './create-vendor-payment.css'
})
export class CreateVendorPayment extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_VENDOR_PAYMENT';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  readonly vendorPaymentStore = inject(VendorPaymentStore);
  readonly vendorStore = inject(VendorStore);
  readonly bankCashStore = inject(BankCashStore);
  readonly currencyStore = inject(CurrencyStore);
  readonly userSessionStore = inject(UserSessionStore);
  readonly selectedVendorPayment = this.vendorPaymentStore.selectedItem;

  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  readonly purchaseInvoices = this.purchaseInvoiceStore.items;

  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('vendor-payment', this.mode(), this.itemId()));
  readonly submitting = signal(false);
  
  readonly vendors = this.vendorStore.items;
  readonly bankCashAccounts = this.bankCashStore.items;
  currencies = signal<Currency[]>([]);
  filteredVendors = signal<Vendor[]>([]);
  filteredCurrencies = signal<Currency[]>([]);
  filteredBankCashes = signal<BankCash[]>([]);

  readonly form = this.fb.group<VendorPaymentForm>({
    pmtdate: new FormControl<string | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    vendor: new FormControl<Vendor | null>(null, {
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
    invoices: new FormArray<FormGroup<InvoiceForm>>([this.buildInvoiceForm()]),
  });

  readonly title = signal('Vendor Payment Setup');

  private buildInvoiceForm(seed?: InvoiceFormValue): FormGroup<InvoiceForm> {
    return this.fb.group<InvoiceForm>({
      invoice: new FormControl<PurchaseInvoice | null>(seed?.invoice ?? null, { nonNullable: false }),
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
      this.filteredVendors.set(this.vendors());
    });

    effect(() => {
      this.filteredBankCashes.set(this.bankCashAccounts());
    });

    this.binder = this.bindFormToDraft<VendorPayment>(
      this.form,
      this.formKey,
      {
        selected: this.selectedVendorPayment,
        persistIf: (form, v) => form.dirty && !!v,
      }
    );
  }

  private binder: { clear: () => void };

  private fillFormEffect = effect(() => {
    const vendorPayment = this.selectedVendorPayment();
    if (vendorPayment) {
      // Format date for input
      const dateValue = dayjs(vendorPayment.date).format(DEFAULT_NODE_DATE_FORMAT);
      this.form.patchValue({
        ...vendorPayment,
        pmtdate: dateValue,
      });
      if(vendorPayment.invoices?.length) {
        this.invoices.clear();
        vendorPayment.invoices.forEach(invoice => {
          const purchaseInvoice = invoice.purchaseinvoice;
          if(purchaseInvoice) {
            this.invoices.push(this.buildInvoiceForm({
              invoice: purchaseInvoice,
              amount: invoice.amount,
            }));
          }
        });
      }
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.vendorPaymentStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  readonly createSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(vendorPaymentActions.createVendorPaymentSuccess),
      tap(() => {
        this.submitting.set(false);
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly createFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(vendorPaymentActions.createVendorPaymentFailure),
      tap(() => {
        this.submitting.set(false);
        this.vendorPaymentStore.setError(null);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(vendorPaymentActions.updateVendorPaymentSuccess),
      tap(() => {
        this.submitting.set(false);
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(vendorPaymentActions.updateVendorPaymentFailure),
      tap(() => {
        this.submitting.set(false);
        this.vendorPaymentStore.setError(null);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  private goBack = () => {
    const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/app/trading/vendor-payment';
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
        this.store.dispatch(vendorPaymentActions.loadVendorPaymentById({ id: this.itemId()!, query: { includes: 
          ['vendor', 'currency', 'bcash', 'invoices.purchaseinvoice'] } }));
      }else{
        this.loading = false;
      }
    }
    
    // Load initial data for autocomplete fields
    this.store.dispatch(vendorActions.loadVendors({ query: { limit: 20 } }));
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

  findInvoiceDisplayValue = (invoice: PurchaseInvoice): string => {
    const branch = this.userSessionStore.branch();
    const vendor = this.form.get('vendor')?.value as Vendor;
    const formCurrency = this.form.get('currency')?.value as Currency;
    const currency = formCurrency ?? invoice.currency ?? vendor?.currency;
    const fraction = currency?.minorunit ?? 2;
    const dateFormat = branch?.dateformat ?? DEFAULT_DATE_FORMAT;
    const amount = `${currency?.symbol ?? ''} ${formatAmountToFraction(invoice.grandtotal ?? 0, fraction)}`;
    return `${invoice.number} dated ${dayjs(invoice.date).format(dateFormat)} of amount ${amount}`;
  };

  onInvoiceSearch(value: string): void {
    const vendor = this.form.get('vendor')?.value as Vendor;
    const search:LB4Search[] = [{query: value, fields: ['number']}];
    if(vendor?.id) {
      search.push({query: vendor.id, fields: ['vendorid']});
    }
    this.store.dispatch(purchaseInvoiceActions.loadPurchaseInvoices({ query: { search: search } }));
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

  // Vendor autocomplete methods
  onVendorSearch(value: string): void {
    this.store.dispatch(vendorActions.loadVendors({ query: { search: [{query: value, fields: ['name', 'mobile', 'email']}], includes: ['currency'] } }));
  }

  findVendorDisplayValue(vendor: Vendor): string {
    return vendor.name;
  }

  findVendorInputDisplayValue(vendor: Vendor): string {
    return vendor.name;
  }

  onVendorSelected(vendor: Vendor): void {
    if(vendor?.currency) {
      this.form.patchValue({ currency: vendor.currency });
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

    const formData = this.form.value as VendorPaymentFormValue;
    const { vendor, currency, bcash, description, amount, pmtdate } = formData;

    if (!pmtdate || !vendor || !currency || !bcash || !amount) {
      this.submitting.set(false);
      return;
    }

    const vendorPayment: VendorPaymentRequest = {
      date: new Date(pmtdate as string),
      amount: toNumber(amount),
      vendorid: vendor.id!,
      currencycode: currency.code,
      bcashid: bcash.id!,
      ...(description && { description }),
    };
    if(this.invoices.length > 0) {
      vendorPayment.invoices = this.invoices.value.map(invoice => ({
        purchaseinvoiceid: invoice.invoice!.id!,
        amount: toNumber(invoice.amount!),
      }));
    }
    if(this.mode() === 'create') {
      this.draftStore.setOneTimeDraft(CreateVendorPayment.ONE_TIME_DRAFT_KEY, vendorPayment);
      this.store.dispatch(vendorPaymentActions.createVendorPayment({ vendorPayment }));
    }else{
      this.store.dispatch(vendorPaymentActions.updateVendorPayment({ id: this.itemId()!, vendorPayment }));
    }
    this.binder.clear();
  }
}


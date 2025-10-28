import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { customerReceiptActions, CustomerReceiptStore } from '../../../store/customer-receipt';
import { CustomerReceipt, CustomerReceiptCU } from '../../../store/customer-receipt/customer-receipt.model';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { buildFormKey, sanitizeQuery } from '../../../../../../util/common.util';
import { Customer } from '../../../store/customer/customer.model';
import { customerActions, CustomerStore } from '../../../store/customer';
import { BankCash } from '../../../store/bank-cash/bank-cash.model';
import { bankCashActions, BankCashStore } from '../../../store/bank-cash';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { currencyActions } from '../../../../../shared/store/currency/currency.action';
import { toNumber } from '../../../../../../util/currency.util';

@Component({
  selector: 'app-create-customer-receipt',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-customer-receipt.html',
  styleUrl: './create-customer-receipt.css'
})
export class CreateCustomerReceipt extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_CUSTOMER_RECEIPT';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly customerReceiptStore = inject(CustomerReceiptStore);
  readonly customerStore = inject(CustomerStore);
  readonly bankCashStore = inject(BankCashStore);
  readonly currencyStore = inject(CurrencyStore);
  readonly selectedCustomerReceipt = this.customerReceiptStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('customer-receipt', this.mode(), this.itemId()));
  readonly customers = this.customerStore.items;
  readonly bankCashAccounts = this.bankCashStore.items;
  currencies = signal<Currency[]>([]);
  
  readonly formFields = signal<FormField[]>([
    { 
      key: 'date', 
      label: 'Receipt Date', 
      type: 'date', 
      required: true, 
      group: 'Basic Details', 
      validators:(value: unknown) => {
        if(!value) {
          return ['Receipt date is required'];
        }
        return [];
      }
    },
    { 
      key: 'customer', 
      label: 'Customer', 
      type: 'auto-complete', 
      required: true, 
      group: 'Basic Details',
      placeholder: 'Search for a customer',
      autoComplete: {
        items: this.customers,
        optionDisplayValue: (item: Customer) => item.name,
        inputDisplayValue: (item: Customer) => item.name,
        trackBy: (item: Customer) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(customerActions.loadCustomers({ query: { search: { query: value, fields: ['name', 'mobile', 'email'] } } }));
        },
      },
      validators:(value: unknown) => {
        if(!value || !(value as Customer).id) {
          return ['Customer is required'];
        }
        return [];
      }
    },
    { 
      key: 'amount', 
      label: 'Amount', 
      type: 'number', 
      required: true, 
      group: 'Basic Details', 
      validators:(value: unknown) => {
        if(!value || Number(value) <= 0) {
          return ['Amount must be greater than 0'];
        }
        return [];
      }
    },
    { 
      key: 'currency', 
      label: 'Currency', 
      type: 'auto-complete', 
      required: true, 
      group: 'Basic Details',
      placeholder: 'Search for a currency',
      autoComplete: {
        items: this.currencies,
        optionDisplayValue: (item: Currency) => `${item.symbol} ${item.name}`,
        inputDisplayValue: (item: Currency) => `${item.symbol} ${item.name}`,
        trackBy: (item: Currency) => item.name,
        onSearch: (value: string) => {
          const sanitized = sanitizeQuery(value);
          this.currencyStore.setSearch(sanitized);
        },
      },
      validators:(value: unknown) => {
        if(!value || !(value as Currency).code) {
          return ['Currency is required'];
        }
        return [];
      }
    },
    { 
      key: 'bcash', 
      label: 'Bank/Cash', 
      type: 'auto-complete', 
      required: true, 
      group: 'Basic Details',
      placeholder: 'Search for a bank/cash account',
      autoComplete: {
        items: this.bankCashAccounts,
        optionDisplayValue: (item: BankCash) => item.name,
        inputDisplayValue: (item: BankCash) => item.name,
        trackBy: (item: BankCash) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(bankCashActions.loadBankCashes({ query: { search: { query: value, fields: ['name', 'description'] } } }));
        },
      },
      validators:(value: unknown) => {
        if(!value || !(value as BankCash).id) {
          return ['Bank/Cash account is required'];
        }
        return [];
      }
    },
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Customer Receipt Setup');

  private fillFormEffect = effect(() => {
    const customerReceipt = this.selectedCustomerReceipt();
    if (customerReceipt) {
      this.form.patchValue(customerReceipt);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.customerReceiptStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly binder = this.bindFormToDraft<CustomerReceipt>(
    this.form,
    this.formKey,
    {
      selected: this.selectedCustomerReceipt,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );

  constructor() {
    super();
    effect(() => {

      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
      }else{
        this.store.dispatch(currencyActions.loadCurrencies({query: {}}));
      }
    });
  }

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(customerReceiptActions.createCustomerReceiptSuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(customerReceiptActions.updateCustomerReceiptSuccess);
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
  }

  handleSubmit = (dataP: CustomerReceipt) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const { customer, currency, bcash, description, amount, date, ...data } = dataP;

    const customerReceipt: CustomerReceiptCU = {
      ...data,
      date: new Date(date!),
      amount: toNumber(amount),
      customerid: customer!.id!,
      currencycode: currency!.code,
      bcashid: bcash!.id!,
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
}


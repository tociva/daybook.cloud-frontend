import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { Subscription } from 'rxjs';
import { DEFAULT_CURRENCY, DEFAULT_NODE_DATE_FORMAT, TWO } from '../../../../../../../util/constants';
import { formatAmountToFraction } from '../../../../../../../util/currency.util';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { Customer } from '../../../../store/customer/customer.model';
import { saleInvoiceActions } from '../../../../store/sale-invoice/sale-invoice.actions';
import { SaleInvoiceStore } from '../../../../store/sale-invoice/sale-invoice.store';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import {
  SaleInvoiceCustomerForm,
  SaleInvoiceForm,
  SaleInvoiceFormValue,
  SaleInvoicePropertiesForm,
  SaleItemsDetailsForm
} from '../../util/sale-invoice-form.type';
import { mapSaleInvoiceFormValueToRequest, saleInvoiceModelToSaleInvoiceFormValue } from '../../util/sale-invoice.util';
import { SaleInvoiceCustomer } from '../sale-invoice-customer/sale-invoice-customer';
import { SaleInvoiceItems } from '../sale-invoice-items/sale-invoice-items';
import { SaleInvoiceProperties } from '../sale-invoice-properties/sale-invoice-properties';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { NgClass } from '@angular/common';
import { SaleInvoiceRequest } from '../../../../store/sale-invoice/sale-invoice-request.type';
import { ToastStore } from '../../../../../../shared/store/toast/toast.store';

@Component({
  selector: 'app-sale-invoice-shell',
  imports: [
    ReactiveFormsModule,
    SkeltonLoader,
    ItemNotFound,
    DeleteButton,
    SaleInvoiceCustomer,
    SaleInvoiceProperties,
    SaleInvoiceItems,
    CancelButton,
    NgClass,
  ],
  templateUrl: './sale-invoice-shell.html',
  styleUrl: './sale-invoice-shell.css',
})
export class SaleInvoiceShell {

  private readonly route = inject(ActivatedRoute);
  private readonly itemId = signal<string | null>(null);
  private readonly store = inject(Store);
  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly toastStore = inject(ToastStore);
  
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly currency = signal<Currency>(DEFAULT_CURRENCY);
  protected readonly title = signal<string>('Create New Sale Invoice');
  protected readonly mode = signal<'create' | 'edit' | 'delete'>('create');
  protected readonly loading = signal<boolean>(true);
  protected form!: FormGroup<SaleInvoiceForm>;
  protected submitting = signal<boolean>(false);
  readonly deleteSuccessAction = saleInvoiceActions.deleteSaleInvoiceSuccess;

  // 👇 Signal that mirrors the customer FormControl (user changes only)
  private readonly customerSig = signal<Customer | null>(null);
  protected readonly taxOption = signal<string>('Intra State');
  private customerSub?: Subscription;
  private taxOptionSub?: Subscription;

  private loadSaleInvoiceById() {
    const itemId = this.route.snapshot.paramMap.get('id') || null;
    if (itemId) {
      this.itemId.set(itemId);
      this.loading.set(true);
      this.store.dispatch(
        saleInvoiceActions.loadSaleInvoiceById({
          id: this.itemId()!,
          query: {
            includes: [
              'currency',
              'customer',
              'items.item',
              'items.taxes.tax',
            ],
          },
        }),
      );
    } else {
      this.loading.set(false);
    }
  }

  /**
   * Wire up the customer FormControl -> customerSig.
   * This uses valueChanges, so:
   * - user changes emit
   * - programmatic patches with { emitEvent: false } do NOT emit
   */
  private watchForCustomerChange = () => {
    const control = this.form.get('customer.customer');
    if (!control) return;

    // Clean up any previous subscription (defensive)
    this.customerSub?.unsubscribe();

    // Set initial value (current control value)
    this.customerSig.set(control.value as Customer | null);

    // React only to user-driven changes
    this.customerSub = control.valueChanges.subscribe((value) => {
      this.customerSig.set(value as Customer | null);
    });
  };

  private watchForTaxOptionChange = () => {
    const control = this.form.get('properties.taxoption');
    if (!control) return;

    this.taxOptionSub?.unsubscribe();
    this.taxOption.set(control.value as string);
    this.taxOptionSub = control.valueChanges.subscribe((value) => {
      this.taxOption.set(value);
    });
  };

  /**
   * Effect: when user changes the customer, sync properties
   */
  private changeCustomerEffect = effect(
    () => {
      const customer = this.customerSig();

      // Guard
      if (!this.form || !customer) return;

      if (customer.currency) {
        this.currency.set(customer.currency);
      }
      this.form.patchValue(
        {
          properties: {
            currency: customer.currency,
            deliverystate: customer.state,
          },
        },
        {
          // Avoid triggering valueChanges loops
          emitEvent: false,
        },
      );
    },
  );

  private readonly loadErrorEffectRef = effect(() => {
    const error = this.saleInvoiceStore.error();
    if (error && this.mode() === 'edit') {
      this.loading.set(false);
    }
  });

  private loadSaleInvoiceSuccessEffect = effect(() => {
    const mode = this.mode();
    if (mode !== 'edit' && mode !== 'delete') {
      return; // ⬅️ don't touch the form in create mode
    }

    const invoice = this.saleInvoiceStore.selectedItem();
    if (!invoice) return;

    const formValue = saleInvoiceModelToSaleInvoiceFormValue(invoice);
    const { itemsDetails, customer, properties } = formValue;

    if (this.currencyStore.currenciesLoaded()) {
      const currency = this.currencyStore
        .currencies()
        .find((c) => c.code === properties.currency?.code);
      if (currency) {
        properties.currency = currency;
      }
    }

    // ⬇️ Programmatic patches: do NOT emit valueChanges → customerSig is NOT updated here
    this.customerGroup().patchValue(customer, { emitEvent: false });
    this.propertiesGroup().patchValue(properties, { emitEvent: false });
    this.itemsDetailsGroup().patchValue({
      showDiscount: itemsDetails.showDiscount,
      showDescription: itemsDetails.showDescription,
    });
    const itemsArray = this.form.controls.itemsDetails.controls.items;
    itemsArray.clear();
    const currency = this.currency();
    itemsDetails.items.forEach((item) => {
      
      const itemRowForm = this.saleInvoiceFormService.buildSaleItemForm(item.taxes.length);
      const minorunit = currency?.minorunit ?? TWO;
      itemRowForm.patchValue({
        name: item.name,
        description: item.description,
        code: item.code,
        price: item.price,
        quantity: item.quantity,
        itemtotal: item.itemtotal,
        discpercent: item.discpercent,
        discamount: item.discamount,
        subtotal: item.subtotal,
        taxamount: item.taxamount,
        grandtotal: item.grandtotal,
        item: item.item,
      }, { emitEvent: false });
      for(let idx = 0; idx < item.taxes.length; idx++) {
        const tax = item.taxes[idx];
        itemRowForm.controls.taxes.at(idx).patchValue({
          tax: tax.tax,
          rate: `${tax.rate} %`,
          amount: formatAmountToFraction(tax.amount, minorunit),
          name: tax.name,
          shortname: tax.shortname,
        }, { emitEvent: false });
      }
      itemsArray.push(itemRowForm);
    });
    this.loading.set(false);
  });

  private initializeForm() {
    const today = dayjs();
    const invDate = today.format(DEFAULT_NODE_DATE_FORMAT);
    const duedate = today.add(7, "days").format(DEFAULT_NODE_DATE_FORMAT);

    this.form.patchValue({
      properties: {
        autoNumbering: true,
        date: invDate,
        duedate: duedate,
      },
      itemsDetails: {
        showDiscount: false,
        showDescription: false,
      },
    });
    const itemsArray = this.form.controls.itemsDetails.controls.items;
    itemsArray.clear();
    itemsArray.push(this.saleInvoiceFormService.buildSaleItemForm(0));
  }

  ngOnInit(): void {
    if (!this.currencyStore.currenciesLoaded()) {
      this.store.dispatch(currencyActions.loadCurrencies({ query: {} }));
    }

    this.form = this.saleInvoiceFormService.createForm();
    this.watchForCustomerChange();
    this.watchForTaxOptionChange();

    const lastSegment =
      this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.title.set('Create New Sale Invoice');
      this.initializeForm();
      this.loading.set(false);
    } else if (lastSegment === 'edit') {
      this.title.set('Edit Sale Invoice');
      this.mode.set('edit');
      this.loading.set(false);
      this.loadSaleInvoiceById();
    } else if (lastSegment === 'delete') {
      this.title.set('Delete Sale Invoice');
      this.mode.set('delete');
      this.loading.set(false);
      this.form.disable({ emitEvent: false });
      this.loadSaleInvoiceById();
    }
  }

  ngOnDestroy(): void {
    this.changeCustomerEffect.destroy();
    this.loadErrorEffectRef.destroy();
    this.loadSaleInvoiceSuccessEffect.destroy();
    this.customerSub?.unsubscribe();
    this.taxOptionSub?.unsubscribe();
  }

  readonly customerGroup = () =>
    this.form.get('customer') as FormGroup<SaleInvoiceCustomerForm>;

  readonly propertiesGroup = () =>
    this.form.get('properties') as FormGroup<SaleInvoicePropertiesForm>;

  readonly itemsDetailsGroup = () =>
    this.form.get('itemsDetails') as FormGroup<SaleItemsDetailsForm>;

  onSubmit() {
    this.submitting.set(true);
    const formValue = this.form.getRawValue() as unknown as SaleInvoiceFormValue;
    const saleInvoiceRequest: SaleInvoiceRequest =  mapSaleInvoiceFormValueToRequest(formValue);
    const {items} = saleInvoiceRequest;
    const invalidItems = items.filter(item => !item.itemid || !item.itemtotal);
    if(invalidItems.length){
      this.submitting.set(false);
      this.toastStore.show({ title: 'Error', message: 'Some items are missing required fields' }, 'error');
      return;
    }
    if(this.mode() === 'create') {
      this.store.dispatch(saleInvoiceActions.createSaleInvoice({ saleInvoice: saleInvoiceRequest }));
    } else if(this.mode() === 'edit') {
      this.store.dispatch(saleInvoiceActions.updateSaleInvoice({ id: this.itemId()!, saleInvoice: saleInvoiceRequest }));
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(saleInvoiceActions.deleteSaleInvoice({ id: this.itemId()! }));
  };

}

import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { Subscription, tap } from 'rxjs';
import { DEFAULT_CURRENCY, DEFAULT_NODE_DATE_FORMAT, TWO } from '../../../../../../../util/constants';
import { formatAmountToFraction } from '../../../../../../../util/currency.util';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { Vendor } from '../../../../store/vendor';
import { purchaseInvoiceActions } from '../../../../store/purchase-invoice/purchase-invoice.actions';
import { PurchaseInvoiceStore } from '../../../../store/purchase-invoice/purchase-invoice.store';
import { PurchaseInvoiceFormService } from '../../util/purchase-invoice-form.service';
import {
  PurchaseInvoiceVendorForm,
  PurchaseInvoiceForm,
  PurchaseInvoiceFormValue,
  PurchaseInvoicePropertiesForm,
  PurchaseItemsDetailsForm
} from '../../util/purchase-invoice-form.type';
import { mapPurchaseInvoiceFormValueToRequest, purchaseInvoiceModelToPurchaseInvoiceFormValue } from '../../util/purchase-invoice.util';
import { PurchaseInvoiceVendor } from '../purchase-invoice-vendor/purchase-invoice-vendor';
import { PurchaseInvoiceItems } from '../purchase-invoice-items/purchase-invoice-items';
import { PurchaseInvoiceProperties } from '../purchase-invoice-properties/purchase-invoice-properties';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { NgClass } from '@angular/common';
import { PurchaseInvoiceRequest } from '../../../../store/purchase-invoice/purchase-invoice-request.type';
import { ToastStore } from '../../../../../../shared/store/toast/toast.store';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-purchase-invoice-shell',
  imports: [
    ReactiveFormsModule,
    SkeltonLoader,
    ItemNotFound,
    DeleteButton,
    PurchaseInvoiceVendor,
    PurchaseInvoiceProperties,
    PurchaseInvoiceItems,
    CancelButton,
    NgClass,
  ],
  templateUrl: './purchase-invoice-shell.html',
  styleUrl: './purchase-invoice-shell.css',
})
export class PurchaseInvoiceShell {

  private readonly route = inject(ActivatedRoute);
  private readonly itemId = signal<string | null>(null);
  private readonly store = inject(Store);
  private readonly purchaseInvoiceFormService = inject(PurchaseInvoiceFormService);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly toastStore = inject(ToastStore);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  protected readonly currency = signal<Currency>(DEFAULT_CURRENCY);
  protected readonly title = signal<string>('Create New Purchase Invoice');
  protected readonly mode = signal<'create' | 'edit' | 'delete'>('create');
  protected readonly loading = signal<boolean>(true);
  protected form!: FormGroup<PurchaseInvoiceForm>;
  protected submitting = signal<boolean>(false);
  readonly deleteSuccessAction = purchaseInvoiceActions.deletePurchaseInvoiceSuccess;

  // 👇 Signal that mirrors the vendor FormControl (user changes only)
  private readonly vendorSig = signal<Vendor | null>(null);
  protected readonly taxOption = signal<string>('Intra State');
  private vendorSub?: Subscription;
  private taxOptionSub?: Subscription;

  private loadPurchaseInvoiceById() {
    const itemId = this.route.snapshot.paramMap.get('id') || null;
    if (itemId) {
      this.itemId.set(itemId);
      this.loading.set(true);
      this.store.dispatch(
        purchaseInvoiceActions.loadPurchaseInvoiceById({
          id: this.itemId()!,
          query: {
            includes: [
              'currency',
              'vendor',
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
   * Wire up the vendor FormControl -> vendorSig.
   * This uses valueChanges, so:
   * - user changes emit
   * - programmatic patches with { emitEvent: false } do NOT emit
   */
  private watchForVendorChange = () => {
    const control = this.form.get('vendor.vendor');
    if (!control) return;

    // Clean up any previous subscription (defensive)
    this.vendorSub?.unsubscribe();

    // Set initial value (current control value)
    this.vendorSig.set(control.value as Vendor | null);

    // React only to user-driven changes
    this.vendorSub = control.valueChanges.subscribe((value) => {
      this.vendorSig.set(value as Vendor | null);
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
   * Effect: when user changes the vendor, sync properties
   */
  private changeVendorEffect = effect(
    () => {
      const vendor = this.vendorSig();

      // Guard
      if (!this.form || !vendor) return;

      if (vendor.currency) {
        this.currency.set(vendor.currency);
      }
      this.form.patchValue(
        {
          properties: {
            currency: vendor.currency,
            sourcestate: vendor.state,
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
    const error = this.purchaseInvoiceStore.error();
    if (error && this.mode() === 'edit') {
      this.loading.set(false);
    }
  });

  private loadPurchaseInvoiceSuccessEffect = effect(() => {
    const mode = this.mode();
    if (mode !== 'edit' && mode !== 'delete') {
      return; // ⬅️ don't touch the form in create mode
    }

    const invoice = this.purchaseInvoiceStore.selectedItem();
    if (!invoice) return;

    const formValue = purchaseInvoiceModelToPurchaseInvoiceFormValue(invoice);
    const { itemsDetails, vendor, properties } = formValue;

    if (this.currencyStore.currenciesLoaded()) {
      const currency = this.currencyStore
        .currencies()
        .find((c) => c.code === properties.currency?.code);
      if (currency) {
        properties.currency = currency;
      }
    }

    // ⬇️ Programmatic patches: do NOT emit valueChanges → vendorSig is NOT updated here
    this.vendorGroup().patchValue(vendor, { emitEvent: false });
    this.propertiesGroup().patchValue(properties, { emitEvent: false });
    this.itemsDetailsGroup().patchValue({
      showDiscount: itemsDetails.showDiscount,
      showDescription: itemsDetails.showDescription,
    });
    const itemsArray = this.form.controls.itemsDetails.controls.items;
    itemsArray.clear();
    const currency = this.currency();
    itemsDetails.items.forEach((item) => {
      
      const itemRowForm = this.purchaseInvoiceFormService.buildPurchaseItemForm(item.taxes.length);
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


  private readonly createSuccessEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(purchaseInvoiceActions.createPurchaseInvoiceSuccess),
      tap(() => {
        this.submitting.set(false);
        const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/';
        this.router.navigateByUrl(burl);
      })
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly createFailureEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(purchaseInvoiceActions.createPurchaseInvoiceFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly updateSuccessEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(purchaseInvoiceActions.updatePurchaseInvoiceSuccess),
      tap(() => {
        this.submitting.set(false);
        const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/';
        this.router.navigateByUrl(burl);
      })
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly updateFailureEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(purchaseInvoiceActions.updatePurchaseInvoiceFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private initializeForm() {
    const today = dayjs();
    const invDate = today.format(DEFAULT_NODE_DATE_FORMAT);
    const duedate = today.add(7, "days").format(DEFAULT_NODE_DATE_FORMAT);

    this.form.patchValue({
      properties: {
        number: '',
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
    itemsArray.push(this.purchaseInvoiceFormService.buildPurchaseItemForm(0));
  }

  ngOnInit(): void {
    if (!this.currencyStore.currenciesLoaded()) {
      this.store.dispatch(currencyActions.loadCurrencies({ query: {} }));
    }

    this.form = this.purchaseInvoiceFormService.createForm();
    this.watchForVendorChange();
    this.watchForTaxOptionChange();

    const lastSegment =
      this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.title.set('Create New Purchase Invoice');
      this.initializeForm();
      this.loading.set(false);
    } else if (lastSegment === 'edit') {
      this.title.set('Edit Purchase Invoice');
      this.mode.set('edit');
      this.loading.set(false);
      this.loadPurchaseInvoiceById();
    } else if (lastSegment === 'delete') {
      this.title.set('Delete Purchase Invoice');
      this.mode.set('delete');
      this.loading.set(false);
      this.form.disable({ emitEvent: false });
      this.loadPurchaseInvoiceById();
    }
  }

  ngOnDestroy(): void {
    this.changeVendorEffect.destroy();
    this.loadErrorEffectRef.destroy();
    this.loadPurchaseInvoiceSuccessEffect.destroy();
    this.vendorSub?.unsubscribe();
    this.taxOptionSub?.unsubscribe();
    this.createSuccessEffectRef.destroy();
    this.createFailureEffectRef.destroy();
    this.updateSuccessEffectRef.destroy();
    this.updateFailureEffectRef.destroy();
  }

  readonly vendorGroup = () =>
    this.form.get('vendor') as FormGroup<PurchaseInvoiceVendorForm>;

  readonly propertiesGroup = () =>
    this.form.get('properties') as FormGroup<PurchaseInvoicePropertiesForm>;

  readonly itemsDetailsGroup = () =>
    this.form.get('itemsDetails') as FormGroup<PurchaseItemsDetailsForm>;

  onSubmit() {
    this.submitting.set(true);
    const formValue = this.form.getRawValue() as unknown as PurchaseInvoiceFormValue;
    const purchaseInvoiceRequest: PurchaseInvoiceRequest =  mapPurchaseInvoiceFormValueToRequest(formValue);
    const {items} = purchaseInvoiceRequest;
    const invalidItems = items.filter(item => !item.itemid || !item.itemtotal);
    if(invalidItems.length){
      this.submitting.set(false);
      this.toastStore.show({ title: 'Error', message: 'Some items are missing required fields' }, 'error');
      return;
    }
    if(this.mode() === 'create') {
      this.store.dispatch(purchaseInvoiceActions.createPurchaseInvoice({ purchaseInvoice: purchaseInvoiceRequest }));
    } else if(this.mode() === 'edit') {
      this.store.dispatch(purchaseInvoiceActions.updatePurchaseInvoice({ id: this.itemId()!, purchaseInvoice: purchaseInvoiceRequest }));
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(purchaseInvoiceActions.deletePurchaseInvoice({ id: this.itemId()! }));
  };

}


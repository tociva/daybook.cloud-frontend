import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { startWith, tap } from 'rxjs';
import { TWO } from '../../../../../../../util/constants';
import { formatAmountToFraction, formatAmountToWords } from '../../../../../../../util/currency.util';
import { FormUtil } from '../../../../../../../util/form/form.util';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { PurchaseInvoiceRequest } from '../../../../store/purchase-invoice/purchase-invoice-request.type';
import { purchaseInvoiceActions } from '../../../../store/purchase-invoice/purchase-invoice.actions';
import { PurchaseInvoiceStore } from '../../../../store/purchase-invoice/purchase-invoice.store';
import { PurchaseItemTax } from '../../../../store/purchase-invoice/purchase-item-tax.model';
import { PurchaseInvoiceFormService } from '../../util/purchase-invoice-form.service';
import { PurchaseInvoiceVendorForm, PurchaseInvoiceFormValue, PurchaseInvoicePropertiesForm, 
  PurchaseInvoiceSummaryForm, PurchaseInvoiceTaxDisplayModeType, PurchaseItemForm } from '../../util/purchase-invoice-form.type';
import { findTaxColumnCount, mapPurchaseInvoiceFormValueToRequest, purchaseInvoiceModelToPurchaseInvoiceFormValue } from '../../util/purchase-invoice.util';
import { PurchaseInvoiceVendor } from '../purchase-invoice-vendor/purchase-invoice-vendor';
import { PurchaseInvoiceItems } from '../purchase-invoice-items/purchase-invoice-items';
import { PurchaseInvoiceProperties } from '../purchase-invoice-properties/purchase-invoice-properties';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ToastStore } from '../../../../../../shared/store/toast/toast.store';
import { PurchaseInvoiceSummary } from '../purchase-invoice-summary/purchase-invoice-summary';

@Component({
  selector: 'app-purchase-invoice-shell',
  imports: [ReactiveFormsModule, PurchaseInvoiceVendor, PurchaseInvoiceProperties, PurchaseInvoiceItems, PurchaseInvoiceSummary, 
    CancelButton, NgClass, AutoComplete, DbcSwitch, SkeltonLoader, ItemNotFound, DeleteButton],
  templateUrl: './purchase-invoice-shell.html',
  styleUrl: './purchase-invoice-shell.css'
})
export class PurchaseInvoiceShell {

  // ---------- Injected services ----------
  private readonly purchaseInvoiceFormService = inject(PurchaseInvoiceFormService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  readonly deleteSuccessAction = purchaseInvoiceActions.deletePurchaseInvoiceSuccess;
  private readonly toastStore = inject(ToastStore);

  // ---------- UI mode & route ----------
  protected readonly mode = signal<'create' | 'edit' | 'delete'>('create');
  private readonly itemId = signal<string | null>(null);
  protected loading = true;
  protected title = signal<string>('Create New Purchase Invoice');
  
  // ---------- Form & typed accessors ----------
  readonly form = this.purchaseInvoiceFormService.createPurchaseInvoiceForm();

  readonly vendorGroup = computed(
    () => this.form.get('vendor') as FormGroup<PurchaseInvoiceVendorForm>
  );

  readonly propertiesGroup = computed(
    () => this.form.get('properties') as FormGroup<PurchaseInvoicePropertiesForm>
  );

  readonly itemsGroup = computed(
    () => this.form.get('items') as FormArray<FormGroup<PurchaseItemForm>>
  );

  readonly summaryGroup = computed(
    () => this.form.get('summary') as FormGroup<PurchaseInvoiceSummaryForm>
  );

  // ---------- Options & helpers ----------
  readonly taxDisplayModes = computed(
    () => Object.values(PurchaseInvoiceTaxDisplayModeType) as PurchaseInvoiceTaxDisplayModeType[]
  );
  readonly findTaxDisplayModeDisplayValue = (m: PurchaseInvoiceTaxDisplayModeType) => m;

  // ---------- UI/runtime state ----------
  readonly fractions = signal<number>(2);
  readonly submitting = signal<boolean>(false);

  // Writable control signals (keeps form state & signals in sync)
  readonly taxDisplayMode = FormUtil.controlWritableSignal<PurchaseInvoiceTaxDisplayModeType>(
    this.form, 'taxDisplayMode', PurchaseInvoiceTaxDisplayModeType.NON_TAXABLE
  );
  readonly showDiscount = FormUtil.controlWritableSignal<boolean>(this.form, 'showDiscount', false);
  readonly showDescription = FormUtil.controlWritableSignal<boolean>(this.form, 'showDescription', false);

  // ---------- Store selection ----------
  readonly selectedInvoice = this.purchaseInvoiceStore.selectedItem;

  // ---------- Signals from form controls ----------
  readonly vendorSignal = toSignal(
    (this.vendorGroup().get('vendor') as FormControl).valueChanges.pipe(
      startWith(this.vendorGroup().get('vendor')?.value)
    ),
    { initialValue: this.vendorGroup().get('vendor')?.value }
  );

  readonly taxModeSignal = toSignal(
    (this.propertiesGroup().get('taxoption') as FormControl).valueChanges.pipe(
      startWith(this.propertiesGroup().get('taxoption')?.value)
    ),
    { initialValue: this.propertiesGroup().get('taxoption')?.value }
  );
  readonly taxMode = computed(() => this.taxModeSignal());

  readonly currencySignal = toSignal(
    (this.propertiesGroup().get('currency') as FormControl).valueChanges.pipe(
      startWith(this.propertiesGroup().get('currency')?.value)
    ),
    { initialValue: this.propertiesGroup().get('currency')?.value }
  );
  readonly currency = computed(() => this.currencySignal());

  // ---------- Effects (keep references to destroy) ----------
  private readonly vendorEffectRef = effect(() => {
    const vendor = this.vendorSignal();
    if (!vendor) return;

    if (vendor.currency) {
      this.propertiesGroup().patchValue({ currency: vendor.currency });
      this.fractions.set(vendor.currency.fractions ?? TWO);
    }
    if (vendor.state) {
      this.propertiesGroup().patchValue({ deliverystate: vendor.state });
    }
  });

  private readonly taxModeEffectRef = effect(() => {
    const taxMode = this.taxMode();
    if (taxMode === 'Inter State') {
      this.taxDisplayMode.set(PurchaseInvoiceTaxDisplayModeType.IGST);
    } else if (taxMode === 'Intra State') {
      this.taxDisplayMode.set(PurchaseInvoiceTaxDisplayModeType.CGST_SGST);
    } else {
      this.taxDisplayMode.set(PurchaseInvoiceTaxDisplayModeType.NON_TAXABLE);
    }
  });

  private readonly taxDisplayModeEffectRef = effect(() => {
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);

    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<PurchaseItemTax>[] = Array.from({ length: needed }, () => ({}));

      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
        const taxesFa = this.purchaseInvoiceFormService.buildPurchaseItemTaxesForm(blanks);
        item.setControl('taxes', taxesFa, { emitEvent: false });
      }
    });
  });

  private readonly currencyEffectRef = effect(() => {
    const curr = this.currencySignal();
    if (curr) {
      this.fractions.set(curr.minorunit ?? TWO);
    }
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

  private readonly loadErrorEffectRef = effect(() => {
    const error = this.purchaseInvoiceStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly effectTaxDisplayMode = effect(() => {
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);
    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<PurchaseItemTax>[] = Array.from({ length: needed }, () => ({}));
  
      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
        const taxesFa = this.purchaseInvoiceFormService.buildPurchaseItemTaxesForm(blanks);
        item.setControl('taxes', taxesFa, { emitEvent: false });
      }
    });
  });

  private readonly createActionSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(purchaseInvoiceActions.createPurchaseInvoiceSuccess),
      tap(() => {
        this.submitting.set(false);
        const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/';
        this.router.navigateByUrl(burl);
      })
    ).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  private readonly createActionFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(purchaseInvoiceActions.createPurchaseInvoiceFailure),
      tap(() => {
        this.submitting.set(false);
      })
    ).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  private fillFormEffectRef = effect(() => {
    const invoice = this.selectedInvoice();
    if(invoice) {
      const formValue = purchaseInvoiceModelToPurchaseInvoiceFormValue(invoice);
      const {items, ...rest} = formValue;
      this.form.patchValue(rest);
      this.itemsGroup().clear();
      items.forEach(item => {
        this.itemsGroup().push(this.purchaseInvoiceFormService.buildPurchaseItemForm(item, this.fractions()));
      });
    }
    this.loading = false;
  });

  private reCalculateSummary = () => {
    let itemtotal = 0;
    let discount = 0;
    let subtotal = 0;
    let tax = 0;
    let grandtotal = 0;
    this.form.controls.items.controls.forEach(item => {
      itemtotal += Number(item.get('itemtotal')?.value ?? 0);
      discount += Number(item.get('discamount')?.value ?? 0);
      subtotal += Number(item.get('subtotal')?.value ?? 0);
      tax += Number(item.get('taxamount')?.value ?? 0);
      grandtotal += Number(item.get('grandtotal')?.value ?? 0); 
    });
    const roundoff = Number(this.form.get('summary')?.get('roundoff')?.value ?? 0);
    grandtotal += roundoff;
    this.summaryGroup().patchValue({ 
      itemtotal: formatAmountToFraction(itemtotal, this.fractions()), 
      discount: formatAmountToFraction(discount, this.fractions()), 
      subtotal: formatAmountToFraction(subtotal, this.fractions()), 
      tax: formatAmountToFraction(tax, this.fractions()), 
      roundoff: formatAmountToFraction(roundoff, this.fractions()), 
      grandtotal: formatAmountToFraction(grandtotal, this.fractions()),
      words: formatAmountToWords(grandtotal, this.currency()) 
    }, { emitEvent: false });
  }

  private loadPurchaseInvoiceById() {
    const itemId = this.route.snapshot.paramMap.get('id') || null;
    if(itemId) {
      this.itemId.set(itemId);
      this.loading = true;
      this.store.dispatch(purchaseInvoiceActions.loadPurchaseInvoiceById({ 
        id: this.itemId()!, 
        query: { includes: ['currency', 'vendor', 'items.item','items.taxes.tax'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    if (lastSegment === 'create') {
      this.title.set('Create New Purchase Invoice');
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.title.set('Edit Purchase Invoice');
      this.mode.set('edit');
      this.loadPurchaseInvoiceById();
    } else if(lastSegment === 'delete') {
      this.title.set('Delete Purchase Invoice');
      this.mode.set('delete');
      this.form.disable();
      this.loadPurchaseInvoiceById();
    }
  }

  ngOnDestroy() {
    this.vendorEffectRef.destroy();
    this.currencyEffectRef.destroy();
    this.createActionSuccessEffect.destroy();
    this.createActionFailureEffect.destroy();
    this.effectTaxDisplayMode.destroy();
    this.fillFormEffectRef.destroy();
    this.createSuccessEffectRef.destroy();
    this.createFailureEffectRef.destroy();
    this.updateSuccessEffectRef.destroy();
    this.updateFailureEffectRef.destroy();
    this.loadErrorEffectRef.destroy();
    this.taxModeEffectRef.destroy();
    this.taxDisplayModeEffectRef.destroy();
  }

  onItemUpdate = () => this.reCalculateSummary();

  onRoundoffChange = () => this.reCalculateSummary();
  
  onSubmit() {
    this.submitting.set(true);
    const formValue = this.form.getRawValue() as unknown as PurchaseInvoiceFormValue;
    const purchaseInvoiceRequest: PurchaseInvoiceRequest = mapPurchaseInvoiceFormValueToRequest(formValue);
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


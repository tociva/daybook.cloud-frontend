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
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { ToastStore } from '../../../../../../shared/store/toast/toast.store';
import { SaleInvoiceRequest } from '../../../../store/sale-invoice/sale-invoice-request.type';
import { saleInvoiceActions } from '../../../../store/sale-invoice/sale-invoice.actions';
import { SaleInvoiceStore } from '../../../../store/sale-invoice/sale-invoice.store';
import { SaleItemTax } from '../../../../store/sale-invoice/sale-item-tax.model';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import {
  SaleInvoiceCustomerForm, SaleInvoiceFormValue, SaleInvoicePropertiesForm,
  SaleInvoiceSummaryForm, SaleInvoiceTaxDisplayModeType, SaleItemForm
} from '../../util/sale-invoice-form.type';
import { findTaxColumnCount, mapSaleInvoiceFormValueToRequest, saleInvoiceModelToSaleInvoiceFormValue } from '../../util/sale-invoice.util';
import { SaleInvoiceCustomer } from '../sale-invoice-customer/sale-invoice-customer';
import { SaleInvoiceProperties } from '../sale-invoice-properties/sale-invoice-properties';
import { SaleInvoiceItems } from '../sale-invoice-items/sale-invoice-items';
import { SaleInvoiceSummary } from '../sale-invoice-summary/sale-invoice-summary';

@Component({
  selector: 'app-sale-invoice-shell',
  imports: [ReactiveFormsModule, SaleInvoiceCustomer, SaleInvoiceProperties, SaleInvoiceItems, SaleInvoiceSummary, 
    CancelButton, NgClass, AutoComplete, DbcSwitch, SkeltonLoader, ItemNotFound, DeleteButton],
  templateUrl: './sale-invoice-shell.html',
  styleUrl: './sale-invoice-shell.css'
})
export class SaleInvoiceShell {

  // ---------- Injected services ----------
  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  readonly saleInvoiceStore = inject(SaleInvoiceStore);
  readonly deleteSuccessAction = saleInvoiceActions.deleteSaleInvoiceSuccess;
  private readonly toastStore = inject(ToastStore);

  // ---------- UI mode & route ----------
  protected readonly mode = signal<'create' | 'edit' | 'delete'>('create');
  private readonly itemId = signal<string | null>(null);
  protected loading = true;
  protected title = signal<string>('Create New Sale Invoice');
  // ---------- Form & typed accessors ----------
  readonly form = this.saleInvoiceFormService.createSaleInvoiceForm();

  readonly customerGroup = computed(
    () => this.form.get('customer') as FormGroup<SaleInvoiceCustomerForm>
  );

  readonly propertiesGroup = computed(
    () => this.form.get('properties') as FormGroup<SaleInvoicePropertiesForm>
  );

  readonly itemsGroup = computed(
    () => this.form.get('items') as FormArray<FormGroup<SaleItemForm>>
  );

  readonly summaryGroup = computed(
    () => this.form.get('summary') as FormGroup<SaleInvoiceSummaryForm>
  );

  // ---------- Options & helpers ----------
  readonly taxDisplayModes = computed(
    () => Object.values(SaleInvoiceTaxDisplayModeType) as SaleInvoiceTaxDisplayModeType[]
  );
  readonly findTaxDisplayModeDisplayValue = (m: SaleInvoiceTaxDisplayModeType) => m;

  // ---------- UI/runtime state ----------
  readonly fractions = signal<number>(2);
  readonly submitting = signal<boolean>(false);

  // Writable control signals (keeps form state & signals in sync)
  readonly taxDisplayMode = FormUtil.controlWritableSignal<SaleInvoiceTaxDisplayModeType>(
    this.form, 'taxDisplayMode', SaleInvoiceTaxDisplayModeType.NON_TAXABLE
  );
  readonly showDiscount = FormUtil.controlWritableSignal<boolean>(this.form, 'showDiscount', false);
  readonly showDescription = FormUtil.controlWritableSignal<boolean>(this.form, 'showDescription', false);

  // ---------- Store selection ----------
  readonly selectedInvoice = this.saleInvoiceStore.selectedItem; // assumed signal-like getter

  // ---------- Signals from form controls ----------
  readonly customerSignal = toSignal(
    (this.customerGroup().get('customer') as FormControl).valueChanges.pipe(
      startWith(this.customerGroup().get('customer')?.value)
    ),
    { initialValue: this.customerGroup().get('customer')?.value }
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
  private readonly customerEffectRef = effect(() => {
    const customer = this.customerSignal();
    if (!customer) return;

    if (customer.currency) {
      this.propertiesGroup().patchValue({ currency: customer.currency });
      this.fractions.set(customer.currency.fractions ?? TWO);
    }
    if (customer.state) {
      this.propertiesGroup().patchValue({ deliverystate: customer.state });
    }
  });

  private readonly taxModeEffectRef = effect(() => {
    const taxMode = this.taxMode();
    if (taxMode === 'Inter State') {
      this.taxDisplayMode.set(SaleInvoiceTaxDisplayModeType.IGST);
    } else if (taxMode === 'Intra State') {
      this.taxDisplayMode.set(SaleInvoiceTaxDisplayModeType.CGST_SGST);
    } else {
      this.taxDisplayMode.set(SaleInvoiceTaxDisplayModeType.NON_TAXABLE);
    }
  });

  private readonly taxDisplayModeEffectRef = effect(() => {
    // Reshape taxes array length per item whenever display mode changes
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);

    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<SaleItemTax>[] = Array.from({ length: needed }, () => ({}));

      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
        const taxesFa = this.saleInvoiceFormService.buildSaleItemTaxesForm(blanks);
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
      ofType(saleInvoiceActions.createSaleInvoiceSuccess),
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
      ofType(saleInvoiceActions.createSaleInvoiceFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly updateSuccessEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(saleInvoiceActions.updateSaleInvoiceSuccess),
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
      ofType(saleInvoiceActions.updateSaleInvoiceFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly loadErrorEffectRef = effect(() => {
    const error = this.saleInvoiceStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly effectTaxDisplayMode = effect(() => {
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);
    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<SaleItemTax>[] = Array.from({ length: needed }, () => ({}));
  
      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
  
        // Build a brand-new FormArray with the exact length
        const taxesFa = this.saleInvoiceFormService.buildSaleItemTaxesForm(blanks);
  
        // Replace the existing control atomically (no need to clear/remove first)
        item.setControl('taxes', taxesFa, { emitEvent: false });
      }
    });
  });

  private readonly createActionSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(saleInvoiceActions.createSaleInvoiceSuccess),
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
      ofType(saleInvoiceActions.createSaleInvoiceFailure),
      tap(() => {
        this.submitting.set(false);
      })
    ).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  private fillFormEffectRef = effect(() => {
    const invoice = this.selectedInvoice();
    if(invoice) {
      const formValue = saleInvoiceModelToSaleInvoiceFormValue(invoice);
      const {items, ...rest} = formValue;
      this.form.patchValue(rest);
      this.itemsGroup().clear();
      items.forEach(item => {
        this.itemsGroup().push(this.saleInvoiceFormService.buildSaleItemForm(item, this.fractions()));
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
      tax: formatAmountToFraction(tax, this.fractions()), roundoff: 
      formatAmountToFraction(roundoff, this.fractions()), 
      grandtotal: formatAmountToFraction(grandtotal, this.fractions()),
      words: formatAmountToWords(grandtotal, this.currency()) },
    { emitEvent: false });
  }

  private loadSaleInvoiceById() {
    const itemId = this.route.snapshot.paramMap.get('id') || null;
      if(itemId) {
        this.itemId.set(itemId);
        this.loading = true;
        this.store.dispatch(saleInvoiceActions.loadSaleInvoiceById({ id: this.itemId()! , query: { includes: ['currency', 'customer', 'items.item','items.taxes.tax'] } }));
      }else{
        this.loading = false;
      }
    }
    ngOnInit(): void {
      const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
      if (lastSegment === 'create') {
        this.title.set('Create New Sale Invoice');
        this.loading = false;
      } else if (lastSegment === 'edit') {
      this.title.set('Edit Sale Invoice');
      this.mode.set('edit');
      this.loadSaleInvoiceById();
    } else if(lastSegment === 'delete') {
      this.title.set('Delete Sale Invoice');
      this.mode.set('delete');
      this.form.disable();
      this.loadSaleInvoiceById();
    }
  }

  ngOnDestroy() {
    this.customerEffectRef.destroy();
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

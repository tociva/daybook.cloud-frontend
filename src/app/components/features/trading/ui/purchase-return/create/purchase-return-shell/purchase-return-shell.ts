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
import { PurchaseReturnRequest } from '../../../../store/purchase-return/purchase-return-request.type';
import { purchaseReturnActions } from '../../../../store/purchase-return/purchase-return.actions';
import { PurchaseReturnStore } from '../../../../store/purchase-return/purchase-return.store';
import { PurchaseReturnItemTax } from '../../../../store/purchase-return/purchase-return-item-tax.model';
import { PurchaseReturnFormService } from '../../util/purchase-return-form.service';
import { PurchaseReturnPurchaseInvoiceForm, PurchaseReturnFormValue, PurchaseReturnPropertiesForm, 
  PurchaseReturnSummaryForm, PurchaseReturnTaxDisplayModeType, PurchaseReturnItemForm } from '../../util/purchase-return-form.type';
import { findTaxColumnCount, mapPurchaseReturnFormValueToRequest, purchaseReturnModelToPurchaseReturnFormValue } from '../../util/purchase-return.util';
import { PurchaseReturnPurchaseInvoice } from '../purchase-return-purchase-invoice/purchase-return-purchase-invoice';
import { PurchaseReturnItems } from '../purchase-return-items/purchase-return-items';
import { PurchaseReturnProperties } from '../purchase-return-properties/purchase-return-properties';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ToastStore } from '../../../../../../shared/store/toast/toast.store';
import { PurchaseReturnSummary } from '../purchase-return-summary/purchase-return-summary';

@Component({
  selector: 'app-purchase-return-shell',
  imports: [ReactiveFormsModule, PurchaseReturnPurchaseInvoice, PurchaseReturnProperties, PurchaseReturnItems, PurchaseReturnSummary, 
    CancelButton, NgClass, AutoComplete, DbcSwitch, SkeltonLoader, ItemNotFound, DeleteButton],
  templateUrl: './purchase-return-shell.html',
  styleUrl: './purchase-return-shell.css'
})
export class PurchaseReturnShell {

  // ---------- Injected services ----------
  private readonly purchaseReturnFormService = inject(PurchaseReturnFormService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  readonly purchaseReturnStore = inject(PurchaseReturnStore);
  readonly deleteSuccessAction = purchaseReturnActions.deletePurchaseReturnSuccess;
  private readonly toastStore = inject(ToastStore);

  // ---------- UI mode & route ----------
  protected readonly mode = signal<'create' | 'edit' | 'delete'>('create');
  private readonly itemId = signal<string | null>(null);
  protected loading = true;
  protected title = signal<string>('Create New Purchase Return');
  
  // ---------- Form & typed accessors ----------
  readonly form = this.purchaseReturnFormService.createPurchaseReturnForm();

  readonly purchaseInvoiceGroup = computed(
    () => this.form.get('purchaseinvoice') as FormGroup<PurchaseReturnPurchaseInvoiceForm>
  );

  readonly propertiesGroup = computed(
    () => this.form.get('properties') as FormGroup<PurchaseReturnPropertiesForm>
  );

  readonly itemsGroup = computed(
    () => this.form.get('items') as FormArray<FormGroup<PurchaseReturnItemForm>>
  );

  readonly summaryGroup = computed(
    () => this.form.get('summary') as FormGroup<PurchaseReturnSummaryForm>
  );

  // ---------- Options & helpers ----------
  readonly taxDisplayModes = computed(
    () => Object.values(PurchaseReturnTaxDisplayModeType) as PurchaseReturnTaxDisplayModeType[]
  );
  readonly findTaxDisplayModeDisplayValue = (m: PurchaseReturnTaxDisplayModeType) => m;

  // ---------- UI/runtime state ----------
  readonly fractions = signal<number>(2);
  readonly submitting = signal<boolean>(false);

  // Writable control signals (keeps form state & signals in sync)
  readonly taxDisplayMode = FormUtil.controlWritableSignal<PurchaseReturnTaxDisplayModeType>(
    this.form, 'taxDisplayMode', PurchaseReturnTaxDisplayModeType.NON_TAXABLE
  );
  readonly showDescription = FormUtil.controlWritableSignal<boolean>(this.form, 'showDescription', false);

  // ---------- Store selection ----------
  readonly selectedPurchaseReturn = this.purchaseReturnStore.selectedItem;

  // ---------- Signals from form controls ----------
  readonly purchaseInvoiceSignal = toSignal(
    (this.purchaseInvoiceGroup().get('purchaseinvoice') as FormControl).valueChanges.pipe(
      startWith(this.purchaseInvoiceGroup().get('purchaseinvoice')?.value)
    ),
    { initialValue: this.purchaseInvoiceGroup().get('purchaseinvoice')?.value }
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
  private readonly purchaseInvoiceEffectRef = effect(() => {
    const purchaseInvoice = this.purchaseInvoiceSignal();
    if (!purchaseInvoice) return;

    if (purchaseInvoice.currency) {
      this.propertiesGroup().patchValue({ currency: purchaseInvoice.currency });
      this.fractions.set(purchaseInvoice.currency.fractions ?? TWO);
    }
  });

  private readonly taxModeEffectRef = effect(() => {
    const taxMode = this.taxMode();
    if (taxMode === 'Inter State') {
      this.taxDisplayMode.set(PurchaseReturnTaxDisplayModeType.IGST);
    } else if (taxMode === 'Intra State') {
      this.taxDisplayMode.set(PurchaseReturnTaxDisplayModeType.CGST_SGST);
    } else {
      this.taxDisplayMode.set(PurchaseReturnTaxDisplayModeType.NON_TAXABLE);
    }
  });

  private readonly taxDisplayModeEffectRef = effect(() => {
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);

    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<PurchaseReturnItemTax>[] = Array.from({ length: needed }, () => ({}));

      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
        const taxesFa = this.purchaseReturnFormService.buildPurchaseReturnItemTaxesForm(blanks);
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
      ofType(purchaseReturnActions.createPurchaseReturnSuccess),
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
      ofType(purchaseReturnActions.createPurchaseReturnFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly updateSuccessEffectRef = effect((onCleanup) => {
    const sub = this.actions$.pipe(
      ofType(purchaseReturnActions.updatePurchaseReturnSuccess),
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
      ofType(purchaseReturnActions.updatePurchaseReturnFailure),
      tap(() => this.submitting.set(false))
    ).subscribe();
    onCleanup(() => sub.unsubscribe());
  });

  private readonly loadErrorEffectRef = effect(() => {
    const error = this.purchaseReturnStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly effectTaxDisplayMode = effect(() => {
    const mode = this.taxDisplayMode();
    const needed = findTaxColumnCount(mode);
    untracked(() => {
      const itemsFa = this.itemsGroup();
      const blanks: Partial<PurchaseReturnItemTax>[] = Array.from({ length: needed }, () => ({}));
  
      for (let i = 0; i < itemsFa.length; i++) {
        const item = itemsFa.at(i);
        const taxesFa = this.purchaseReturnFormService.buildPurchaseReturnItemTaxesForm(blanks);
        item.setControl('taxes', taxesFa, { emitEvent: false });
      }
    });
  });

  private fillFormEffectRef = effect(() => {
    const purchaseReturn = this.selectedPurchaseReturn();
    if(purchaseReturn) {
      const formValue = purchaseReturnModelToPurchaseReturnFormValue(purchaseReturn);
      const {items, ...rest} = formValue;
      this.form.patchValue(rest);
      this.itemsGroup().clear();
      items.forEach(item => {
        this.itemsGroup().push(this.purchaseReturnFormService.buildPurchaseReturnItemForm(item, this.fractions()));
      });
    }
    this.loading = false;
  });

  private reCalculateSummary = () => {
    let itemtotal = 0;
    let tax = 0;
    let grandtotal = 0;
    this.form.controls.items.controls.forEach(item => {
      itemtotal += Number(item.get('itemtotal')?.value ?? 0);
      tax += Number(item.get('taxamount')?.value ?? 0);
      grandtotal += Number(item.get('grandtotal')?.value ?? 0); 
    });
    const roundoff = Number(this.form.get('summary')?.get('roundoff')?.value ?? 0);
    grandtotal += roundoff;
    this.summaryGroup().patchValue({ 
      itemtotal: formatAmountToFraction(itemtotal, this.fractions()), 
      tax: formatAmountToFraction(tax, this.fractions()), 
      roundoff: formatAmountToFraction(roundoff, this.fractions()), 
      grandtotal: formatAmountToFraction(grandtotal, this.fractions()),
      words: formatAmountToWords(grandtotal, this.currency()) 
    }, { emitEvent: false });
  }

  private loadPurchaseReturnById() {
    const itemId = this.route.snapshot.paramMap.get('id') || null;
    if(itemId) {
      this.itemId.set(itemId);
      this.loading = true;
      this.store.dispatch(purchaseReturnActions.loadPurchaseReturnById({ 
        id: this.itemId()!, 
        query: { includes: ['currency', 'purchaseinvoice', 'items.item','items.taxes.tax'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    if (lastSegment === 'create') {
      this.title.set('Create New Purchase Return');
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.title.set('Edit Purchase Return');
      this.mode.set('edit');
      this.loadPurchaseReturnById();
    } else if(lastSegment === 'delete') {
      this.title.set('Delete Purchase Return');
      this.mode.set('delete');
      this.form.disable();
      this.loadPurchaseReturnById();
    }
  }

  ngOnDestroy() {
    this.purchaseInvoiceEffectRef.destroy();
    this.currencyEffectRef.destroy();
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
    const formValue = this.form.getRawValue() as unknown as PurchaseReturnFormValue;
    const purchaseReturnRequest: PurchaseReturnRequest = mapPurchaseReturnFormValueToRequest(formValue);
    const {items} = purchaseReturnRequest;
    const invalidItems = items.filter(item => !item.itemid || !item.itemtotal);
    if(invalidItems.length){
      this.submitting.set(false);
      this.toastStore.show({ title: 'Error', message: 'Some items are missing required fields' }, 'error');
      return;
    }
    if(this.mode() === 'create') {
      this.store.dispatch(purchaseReturnActions.createPurchaseReturn({ purchaseReturn: purchaseReturnRequest }));
    } else if(this.mode() === 'edit') {
      this.store.dispatch(purchaseReturnActions.updatePurchaseReturn({ id: this.itemId()!, purchaseReturn: purchaseReturnRequest }));
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(purchaseReturnActions.deletePurchaseReturn({ id: this.itemId()! }));
  };
}


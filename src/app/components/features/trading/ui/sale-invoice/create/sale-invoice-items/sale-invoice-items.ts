import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs/operators';

import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { formatAmountToFraction } from '../../../../../../../util/currency.util';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { itemActions } from '../../../../store/item';
import { Item } from '../../../../store/item/item.model';
import { ItemStore } from '../../../../store/item/item.store';
import { taxActions, TaxStore } from '../../../../store/tax';
import { taxGroupActions } from '../../../../store/tax-group';
import { TaxGroupStore } from '../../../../store/tax-group/tax-group.store';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import {
  SaleItemsDetailsForm,
} from '../../util/sale-invoice-form.type';

type Column = { key: string; span: number; visible: boolean };
enum TaxStrategyType {
  CGST_SGST = 'CGST SGST',
  IGST = 'IGST',
  CESS = 'CESS',
}

const BASE_COLUMNS: ReadonlyArray<Column> = [
  { key: '#',             span: 1, visible: true  },
  { key: 'name',          span: 8, visible: true  },
  { key: 'description',   span: 8, visible: true  },
  { key: 'price',         span: 2, visible: true  },
  { key: 'quantity',      span: 2, visible: true  },
  { key: 'discount',      span: 2, visible: false },
  { key: 'taxableamount', span: 2, visible: false },
  { key: 'sgst',          span: 2, visible: false },
  { key: 'cgst',          span: 2, visible: false },
  { key: 'igst',          span: 2, visible: false },
  { key: 'cess',          span: 2, visible: false },
  { key: 'grandtotal',    span: 2, visible: true  },
  { key: 'action',        span: 1, visible: true  },
];

@Component({
  selector: 'app-sale-invoice-items',
  imports: [AutoComplete, DbcSwitch, ReactiveFormsModule, NgClass, NgIcon, NumberInputDirective],
  templateUrl: './sale-invoice-items.html',
  styleUrl: './sale-invoice-items.css',
})
export class SaleInvoiceItems implements OnInit {
  // required signal input from parent
  readonly form = input.required<FormGroup<SaleItemsDetailsForm>>();
  readonly fractions = input.required<number>();

  // destroy ref for subscriptions
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService); 

  // signal-backed slices from form controls
  private readonly showDiscountSig   = signal<boolean | null | undefined>(false);
  private readonly showDescriptionSig = signal<boolean | null | undefined>(false);
  private readonly taxOptionSig = signal<string | null | undefined>('Intra State');

  readonly items = this.itemStore.items;
  readonly taxGroups = this.taxGroupStore.items;
  readonly taxes = this.taxStore.items;

  get itemsArray() {
    return this.form().controls.items;
  }

  get taxOption() {
    return this.taxOptionSig();
  }


  get taxColumnCount() {
    for(const taxGroup of this.taxGroups()) {
      for(const group of taxGroup.groups) {
        if(group.mode === this.taxOption) {
          return group.taxids.length;
        }
      }
    }
    return 0;
  }

  get taxStrategies(): TaxStrategyType[] {
    const taxStrategies: TaxStrategyType[] = [];
    const taxOption = this.taxOptionSig() ?? '';
    if(taxOption.toLowerCase().includes('cess')) {
      taxStrategies.push(TaxStrategyType.CESS);
    }
    if(taxOption === 'Inter State') {
      taxStrategies.push(TaxStrategyType.IGST);
    }
    if(taxOption === 'Intra State') {
      taxStrategies.push(TaxStrategyType.CGST_SGST);
    }
    return taxStrategies;
  }

  ngOnInit(): void {
    
    this.store.dispatch(taxGroupActions.loadTaxGroups({}));
    this.store.dispatch(taxActions.loadTaxes({query: {limit: Number.MAX_SAFE_INTEGER}}));
    
    const form = this.form();
    const { showDiscount, showDescription, taxoption } = form.controls;

    // initial values
    this.showDiscountSig.set(!!showDiscount.value);
    this.showDescriptionSig.set(!!showDescription.value);
    this.taxOptionSig.set(taxoption.value);

    // keep signals in sync with form controls

    showDiscount.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.showDiscountSig.set(!!value));

    showDescription.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.showDescriptionSig.set(!!value));

    taxoption.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.taxOptionSig.set(value));
  }

  // computed columns based only on the 3 signals above
  readonly columns: Signal<Column[]> = computed<Column[]>(() => {
    
    const hasDiscount = !!this.showDiscountSig();
    const hasDescription = !!this.showDescriptionSig();

    const hasTax = this.taxStrategies.length > 0;

    return BASE_COLUMNS.map((col) => {
      switch (col.key) {
        case 'name':
          return { ...col, visible: true, span: hasDescription ? 8 : 16 };
        case 'description':
          return { ...col, visible: hasDescription };
        case 'discount':
          return { ...col, visible: hasDiscount };
        case 'taxableamount':
          return { ...col, visible: hasTax };
        case 'sgst':
        case 'cgst':
          return { ...col, visible: this.taxStrategies.includes(TaxStrategyType.CGST_SGST) };
        case 'igst':
          return { ...col, visible: this.taxStrategies.includes(TaxStrategyType.IGST) };
        case 'cess':
          return { ...col, visible: this.taxStrategies.includes(TaxStrategyType.CESS) };
        default:
          return col;
      }
    });
  });

  // dynamically computed total columns (sum of spans of visible columns)
  readonly totalCols = computed(() =>
    this.columns().reduce((sum, col) => sum + (col.visible ? col.span : 0), 0),
  );

  // dynamic grid class for the header row and item rows
  readonly gridClass = computed(() => `grid grid-cols-${this.totalCols()}`);

  colVisibleFor = (key: string) =>
    computed(() => this.columns().find(c => c.key === key)?.visible ?? false);
  
  colSpanFor = (key: string) =>
    computed(() => {
      const col = this.columns().find(c => c.key === key);
      const cssClass = `col-span-${col?.span ?? 1}`;
      return cssClass;
    }
  );

  findItemOptionDisplayValue = (item: Item) => {
    const name = item?.name ?? item?.displayname ?? '';
    if(item.barcode) {
      return `${name} (${item.barcode})`;
    }
    return name;
  }

  findItemDisplayValue = (item: Item) => {
    const name = item?.displayname ?? item?.name ?? '';
    return name;
  }

  onItemSearch = (value: string) => {
    this.store.dispatch(itemActions.loadItems({ query: { search: [{query: value, fields: ['name', 'code', 'description', 'displayname', 'barcode']}], includes: ['category'] } }));
  }
  onItemSelected = (index: number) => (item: Item) => {
    const itemRow = this.itemsArray.at(index);
    const quantity = Number(itemRow.get('quantity')?.value);
    itemRow.patchValue({
      quantity: String(quantity ? quantity : 1)
    }, { emitEvent: true});
    const taxGroupId = item.category?.taxgroupid;
    if(taxGroupId) {
      const fractions = this.fractions();
      const taxGroup = this.taxGroups().find(taxGroup => taxGroup.id === taxGroupId);
      const taxModeObject = taxGroup?.groups.find(group => group.mode === this.taxOption);
      for(let idx = 0; idx < (taxModeObject?.taxids ?? []).length; idx++) {
        const taxId = taxModeObject?.taxids?.[idx];
        const tax = this.taxes().find(tax => tax.id === taxId);
        if(tax) {
          this.itemsArray.at(index).controls.taxes.at(idx).patchValue({
            rate: `${String(tax.rate)} %`,
            appliedto: tax.appliedto,
            amount: formatAmountToFraction(0, fractions),
            name: tax.name,
            shortname: tax.shortname,
            tax: tax,
           }, { emitEvent: true});
        }
      }
    }
  }
  onItemRowChange = (index: number) => () => {
    const fractions = this.fractions();
    const itemRow = this.itemsArray.at(index);
    const price = Number(itemRow.get('price')?.value ?? 0);
    const exQuantity = itemRow.get('quantity')?.value
    const quantity = Number(exQuantity ? exQuantity : 1);
    const itemtotal = price * quantity;
    const discpercent = Number(itemRow.get('discpercent')?.value ?? 0);
    const discamount = itemtotal * ((discpercent / 100));
    const subtotal = itemtotal - discamount;
    const taxControls = itemRow.controls.taxes.length;
    for(let idx = 0; idx < taxControls; idx++) {
      const taxControl = itemRow.controls.taxes.at(idx);
      const tax = taxControl.get('tax')?.value;
      const taxAmount = (Number(tax?.rate ?? 0)) * subtotal / 100;
      taxControl.patchValue({
        rate: `${String(tax?.rate ?? 0)} %`,
        amount: formatAmountToFraction(taxAmount, fractions)
      });
    }
    const taxamount = itemRow.controls.taxes.controls.reduce((acc, tax) => acc + (Number(tax.get('amount')?.value ?? 0)), 0);
    const grandtotal = subtotal + taxamount;
    itemRow.patchValue({
      price: formatAmountToFraction(price, fractions),
      quantity: String(quantity ? quantity : 1),
      itemtotal: formatAmountToFraction(itemtotal, fractions),
      discpercent: formatAmountToFraction(discpercent, fractions),
      discamount: formatAmountToFraction(discamount, fractions),
      subtotal: formatAmountToFraction(subtotal, fractions),
      taxamount: formatAmountToFraction(taxamount, fractions),
      grandtotal: formatAmountToFraction(grandtotal, fractions),
    }, { emitEvent: true});
  }
  removeItemRow(index: number) {
    this.itemsArray.removeAt(index);
  }

  addItemRow() {
    const newGroup = this.saleInvoiceFormService.buildSaleItemForm(this.taxColumnCount);
    this.itemsArray.push(newGroup);
  }
}

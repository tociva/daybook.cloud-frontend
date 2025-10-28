import { NgClass } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { formatAmountToFraction } from '../../../../../../../util/currency.util';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { Item, itemActions, ItemStore } from '../../../../store/item';
import { PurchaseItemTax } from '../../../../store/purchase-invoice/purchase-item-tax.model';
import { Tax, taxActions, TaxStore } from '../../../../store/tax';
import { taxGroupActions, TaxGroupStore } from '../../../../store/tax-group';
import { PurchaseInvoiceFormService } from '../../util/purchase-invoice-form.service';
import { PurchaseInvoiceTaxDisplayModeType, PurchaseItemForm, PurchaseItemTaxForm } from '../../util/purchase-invoice-form.type';
import { findTaxColumnCount } from '../../util/purchase-invoice.util';

type Column = { key: string; span: number, visible: boolean };
const BASE_COLUMNS: ReadonlyArray<Column> = [
  { key: '#',             span: 1, visible: true  },
  { key: 'name',          span: 8, visible: true  },
  { key: 'description',   span: 8, visible: true  },
  { key: 'price',         span: 2, visible: true  },
  { key: 'quantity',      span: 2, visible: true  },
  { key: 'discount',      span: 2, visible: false  },
  { key: 'taxableamount', span: 2, visible: false  },
  { key: 'sgst',          span: 2, visible: false  },
  { key: 'cgst',          span: 2, visible: false  },
  { key: 'igst',          span: 2, visible: false },
  { key: 'cess',          span: 2, visible: false },
  { key: 'grandtotal',    span: 2, visible: true  },
  { key: 'action',        span: 1, visible: true  },
];

@Component({
  selector: 'app-purchase-invoice-items',
  imports: [NgClass, AutoComplete, ReactiveFormsModule, NgIcon, NumberInputDirective],
  templateUrl: './purchase-invoice-items.html',
  styleUrl: './purchase-invoice-items.css'
})
export class PurchaseInvoiceItems {

  private readonly store = inject(Store);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly purchaseInvoiceFormService = inject(PurchaseInvoiceFormService);

  readonly formArray = input.required<FormArray<FormGroup<PurchaseItemForm>>>();
  readonly fractions = input.required<number>();
  readonly onItemUpdate = output<void>();
  readonly taxMode = input<string>();
  readonly taxDisplayMode = input.required<PurchaseInvoiceTaxDisplayModeType>();
  readonly showDiscount = input<boolean>(false);
  readonly showDescription = input<boolean>(false);

  readonly items = this.itemStore.items;
  readonly taxGroups = this.taxGroupStore.items;
  readonly taxes = this.taxStore.items;

  readonly columns = computed<Column[]>(() => {
    const isIgst = [PurchaseInvoiceTaxDisplayModeType.IGST, PurchaseInvoiceTaxDisplayModeType.IGST_CESS].includes(this.taxDisplayMode());
    const hasCess = [PurchaseInvoiceTaxDisplayModeType.CGST_SGST_CESS, PurchaseInvoiceTaxDisplayModeType.IGST_CESS].includes(this.taxDisplayMode());
    const isCGSTSGST = [PurchaseInvoiceTaxDisplayModeType.CGST_SGST, PurchaseInvoiceTaxDisplayModeType.CGST_SGST_CESS].includes(this.taxDisplayMode());
    const hasTax = isCGSTSGST || isIgst || hasCess;
    const hasDiscount = !!this.showDiscount();
    const hasDescription = !!this.showDescription();
    const cols = BASE_COLUMNS.map(col => {
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
          return { ...col, visible: isCGSTSGST };
        case 'igst':
          return { ...col, visible: isIgst };
        case 'cess':
          return { ...col, visible: hasCess };
        default:
          return col;
      }
    });
    return cols;
  });

  readonly totalCols = computed(() =>
    this.columns().reduce((sum, col) => sum + (col.visible ? col.span : 0), 0)
  );

  readonly gridClass = computed(() => `grid grid-cols-${this.totalCols()}`);

  ngOnInit() {
    this.store.dispatch(taxGroupActions.loadTaxGroups({}));
    this.store.dispatch(taxActions.loadTaxes({}));
  }

  colSpanFor = (key: string) =>
    computed(() => {
      const col = this.columns().find(c => c.key === key);
      const cssClass = `col-span-${col?.span ?? 1}`;
      return cssClass;
    });
    
  colVisibleFor = (key: string) =>
    computed(() => this.columns().find(c => c.key === key)?.visible ?? false);

  findItemDisplayValue = (item: Item) => {
    const name = item?.displayname ?? item?.name ?? '';
    return name;
  }

  findItemOptionDisplayValue = (item: Item) => {
    const name = item?.name ?? item?.displayname ?? '';
    if(item.barcode) {
      return `${name} (${item.barcode})`;
    }
    return name;
  }

  onItemSearch = (value: string) => {
    this.store.dispatch(itemActions.loadItems({ query: { search: { query: value, fields: ['name', 'code', 'description', 'displayname', 'barcode'] }, includes: ['category'] } }));
  }

  onItemSelected = (index: number) => (item: Item) => {
    const taxGroupId = item.category?.taxgroupid;
    if(taxGroupId) {
      const taxGroup = this.taxGroups().find(taxGroup => taxGroup.id === taxGroupId);
      const taxModeObject = taxGroup?.groups.find(group => group.mode === this.taxMode());
      for(let idx = 0; idx < (taxModeObject?.taxids ?? []).length; idx++) {
        const taxId = taxModeObject?.taxids?.[idx];
        const tax = this.taxes().find(tax => tax.id === taxId);
        if(tax) {
          const fractions = this.fractions();
          this.formArray().at(index).controls.taxes.at(idx).patchValue({
            rate: formatAmountToFraction(tax.rate, fractions),
            appliedto: tax.appliedto,
            amount: formatAmountToFraction(0, fractions),
            name: tax.name,
            shortname: tax.shortname,
            tax: tax
           });
        }
      }
    }
    
    this.formArray().at(index).patchValue({ item, code: item.code, name: item.name });
  };

  removeItemRow(index: number) {
    this.formArray().removeAt(index);
    this.onItemUpdate.emit();
  }

  addItemRow() {
    const mode = this.taxDisplayMode();
    const taxColumnCount = findTaxColumnCount(mode);
    const taxes:Partial<PurchaseItemTax>[] = [];
    for(let idx = 0; idx < taxColumnCount; idx++) {
      taxes.push({});
    }
    const newGroup = this.purchaseInvoiceFormService.buildPurchaseItemForm();
    const taxesFormArray = this.purchaseInvoiceFormService.buildPurchaseItemTaxesForm(taxes);
    newGroup.setControl('taxes', taxesFormArray);
    this.formArray().push(newGroup);
  }

  onItemRowChange = (index: number) => () => {
    const fractions = this.fractions();
    const itemRow = this.formArray().at(index);
    const price = Number(itemRow.get('price')?.value ?? 0);
    const quantity = Number(itemRow.get('quantity')?.value ?? 1);
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
        rate: formatAmountToFraction(Number(tax?.rate ?? 0), fractions),
        amount: formatAmountToFraction(taxAmount, fractions)
      });
    }
    const taxamount = itemRow.controls.taxes.controls.reduce((acc, tax) => acc + (Number(tax.get('amount')?.value ?? 0)), 0);
    const grandtotal = subtotal + taxamount;
    itemRow.patchValue({
      price: formatAmountToFraction(price, fractions),
      quantity: formatAmountToFraction(quantity, fractions),
      itemtotal: formatAmountToFraction(itemtotal, fractions),
      discpercent: formatAmountToFraction(discpercent, fractions),
      discamount: formatAmountToFraction(discamount, fractions),
      subtotal: formatAmountToFraction(subtotal, fractions),
      taxamount: formatAmountToFraction(taxamount, fractions),
      grandtotal: formatAmountToFraction(grandtotal, fractions),
    });
    this.onItemUpdate.emit();
  }
}


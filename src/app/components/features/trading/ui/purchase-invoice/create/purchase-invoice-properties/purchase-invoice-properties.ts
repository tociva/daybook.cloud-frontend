import { Component, effect, EnvironmentInjector, inject, input, runInInjectionContext, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TextInputDirective } from '../../../../../../../util/directives/text-input.directive';
import { FormUtil } from '../../../../../../../util/form/form.util';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { taxGroupActions } from '../../../../store/tax-group/tax-group.actions';
import { TaxGroupModeStore } from '../../../../store/tax-group/tax-group.store';
import { PurchaseInvoicePropertiesForm } from '../../util/purchase-invoice-form.type';

@Component({
  selector: 'app-purchase-invoice-properties',
  imports: [ReactiveFormsModule, AutoComplete, DbcSwitch, TextInputDirective],
  templateUrl: './purchase-invoice-properties.html',
  styleUrl: './purchase-invoice-properties.css'
})
export class PurchaseInvoiceProperties {

  private readonly store = inject(Store);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly taxGroupModeStore = inject(TaxGroupModeStore);

  readonly form = input.required<FormGroup<PurchaseInvoicePropertiesForm>>();
  readonly uiMode = input.required<string>();

  currencies = signal<Currency[]>([]);
  modes = this.taxGroupModeStore.items;
  filteredModes = signal<string[]>([]);

  private readonly envInjector = inject(EnvironmentInjector);
  private _autoNumberingSig!: WritableSignal<boolean>;
  get autoNumberingSig() { return this._autoNumberingSig; }

  private _taxoptionSig!: WritableSignal<string>;
  get taxoptionSig() { return this._taxoptionSig; }
 
  private changeAutoNumberingEffect = effect(() => {
    const form = this.form?.();
    const uiMode = this.uiMode?.();
    const autoNumberingSig = this.autoNumberingSig;
  
    if (!form || !autoNumberingSig || !uiMode) return;
  
    const autoNumbering = autoNumberingSig();
    const numberCtrl = form.controls.number;
  
    if (autoNumbering) {
      numberCtrl.disable({ emitEvent: false });
      form.patchValue({ number: 'Auto Number' }, { emitEvent: false });
    } else {
      numberCtrl.enable({ emitEvent: false });
      if (uiMode === 'create') {
        form.patchValue({ number: '' }, { emitEvent: false });
      }
    }
  }, { allowSignalWrites: true });

  private changeTaxOptionEffect = effect(() => {
    const form = this.form?.();
    const uiMode = this.uiMode?.();
    const taxoptionSig = this.taxoptionSig;
    if(!form || !taxoptionSig) return;
    const taxoption = taxoptionSig();
    const taxoptionCtrl = form.controls.taxoption;
    if(taxoption === 'Inter State') {
      form.controls['deliverystate'].enable({ emitEvent: false });
    }else{
      form.controls['deliverystate'].disable({ emitEvent: false });
    }
  }, { allowSignalWrites: true });

  constructor() {
    effect(() => {
      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
      }else{
        this.store.dispatch(currencyActions.loadCurrencies({query: {}}));
      }
    });
  }

  ngOnInit() {
    const form = this.form();

    runInInjectionContext(this.envInjector, () => {
      this._autoNumberingSig = FormUtil.controlWritableSignal<boolean>(
        form,
        'autoNumbering',
        true
      );

      this._taxoptionSig = FormUtil.controlWritableSignal<string>(
        form,
        'taxoption',
        'Intra State'
      );
    });
    
    this.store.dispatch(taxGroupActions.loadTaxGroupModes({}));
  }

  ngOnDestroy() {
    this.changeAutoNumberingEffect.destroy();
    this.changeTaxOptionEffect.destroy();
  }

  onCurrencySearch(value: string) {
    this.currencyStore.setSearch(value);
  }

  onCurrencySelected(currency: Currency) {
    this.form().patchValue({ currency: currency });
  }

  findCurrencyDisplayValue(currency: Currency) {
    if(!currency?.name) return '';
    return `${currency.symbol} ${currency.name}`;
  }

  onTaxOptionSearch(value: string) {
    this.filteredModes.set(this.modes().filter(option => option.toLowerCase().includes(value.toLowerCase())));
  }

  onTaxOptionSelected(taxOption: string) {
    this.form().patchValue({ taxoption: taxOption });
  }
}


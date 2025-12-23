import { Component, effect, EnvironmentInjector, inject, input, runInInjectionContext, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TextInputDirective } from '../../../../../../../util/directives/text-input.directive';
import { FormUtil } from '../../../../../../../util/form/form.util';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { taxGroupActions } from '../../../../store/tax-group/tax-group.actions';
import { TaxGroupModeStore } from '../../../../store/tax-group/tax-group.store';
import { PurchaseReturnPropertiesForm } from '../../util/purchase-return-form.type';
import { DbcDatePicker } from '../../../../../../shared/dbc-date-picker/dbc-date-picker';

@Component({
  selector: 'app-purchase-return-properties',
  imports: [ReactiveFormsModule, AutoComplete, TextInputDirective,DbcDatePicker],
  templateUrl: './purchase-return-properties.html',
  styleUrl: './purchase-return-properties.css'
})
export class PurchaseReturnProperties {

  private readonly store = inject(Store);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly taxGroupModeStore = inject(TaxGroupModeStore);

  readonly form = input.required<FormGroup<PurchaseReturnPropertiesForm>>();
  readonly uiMode = input.required<string>();

  currencies = signal<Currency[]>([]);
  modes = this.taxGroupModeStore.items;
  filteredModes = signal<string[]>([]);

  private readonly envInjector = inject(EnvironmentInjector);
  private _taxoptionSig!: WritableSignal<string>;
  get taxoptionSig() { return this._taxoptionSig; }
 
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
      this._taxoptionSig = FormUtil.controlWritableSignal<string>(
        form,
        'taxoption',
        'Intra State'
      );
    });
    
    this.store.dispatch(taxGroupActions.loadTaxGroupModes({}));
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


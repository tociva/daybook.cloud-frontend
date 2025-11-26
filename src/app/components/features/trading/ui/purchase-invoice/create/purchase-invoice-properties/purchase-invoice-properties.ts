import {
  Component,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TextInputDirective } from '../../../../../../../util/directives/text-input.directive';
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
  standalone: true,
  imports: [ReactiveFormsModule, AutoComplete, TextInputDirective, DbcSwitch],
  templateUrl: './purchase-invoice-properties.html',
  styleUrl: './purchase-invoice-properties.css'
})
export class PurchaseInvoiceProperties {

  private readonly store = inject(Store);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly taxGroupModeStore = inject(TaxGroupModeStore);

  readonly form = input.required<FormGroup<PurchaseInvoicePropertiesForm>>();
  readonly uiMode = input.required<'create' | 'edit' | 'delete'>();

  protected readonly modes = this.taxGroupModeStore.items;
  protected readonly filteredModes = signal<string[]>([]);
  protected readonly currencies = signal<Currency[]>([]);

  // 👇 effect is now created in a field initializer (valid injection context)
  private readonly currenciesEffect = effect(() => {
    if (this.currencyStore.currenciesLoaded()) {
      this.currencies.set(this.currencyStore.filteredCurrencies());
    } else {
      this.store.dispatch(currencyActions.loadCurrencies({ query: {} }));
    }
  });

  findCurrencyDisplayValue(currency: Currency) {
    if(!currency?.name) return '';
    return `${currency.symbol} ${currency.name}`;
  }

  onCurrencySearch(value: string) {
    this.currencyStore.setSearch(value);
  }

  onCurrencySelected(currency: Currency) {
    this.form().patchValue({ currency: currency });
  }

  ngOnInit(): void {
    if(!this.taxGroupModeStore.itemsLoaded()) {
      this.store.dispatch(taxGroupActions.loadTaxGroupModes({}));
    }
  }

  ngOnDestroy(): void {
    this.currenciesEffect.destroy();
  }

  onTaxOptionSearch(value: string) {
    this.filteredModes.set(
      this.modes().filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      )
    );
  }
}


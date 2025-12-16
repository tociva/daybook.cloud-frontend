import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, startWith } from 'rxjs';
import { TextInputDirective } from '../../../../../../../util/directives/text-input.directive';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { taxGroupActions } from '../../../../store/tax-group/tax-group.actions';
import { TaxGroupModeStore } from '../../../../store/tax-group/tax-group.store';
import { SaleInvoicePropertiesForm } from '../../util/sale-invoice-form.type';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { DbcDatePicker } from '../../../../../../shared/dbc-date-picker/dbc-date-picker';

@Component({
  selector: 'app-sale-invoice-properties',
  standalone: true,
  imports: [ReactiveFormsModule, AutoComplete, TextInputDirective, DbcSwitch,DbcDatePicker],
  templateUrl: './sale-invoice-properties.html',
  styleUrl: './sale-invoice-properties.css'
})
export class SaleInvoiceProperties {

  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly taxGroupModeStore = inject(TaxGroupModeStore);

  readonly form = input.required<FormGroup<SaleInvoicePropertiesForm>>();
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
    // this.form().patchValue({ currency: currency });
  }

  private initializeAutoNumbering(): void {
    const form = this.form();
    const autoCtrl = form.controls.autoNumbering;
    const numberCtrl = form.controls.number;

    autoCtrl.valueChanges
      .pipe(
        startWith(autoCtrl.value),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(autoNumbering => {
        if (autoNumbering) {
          numberCtrl.disable({ emitEvent: false });
          form.patchValue({ number: 'Auto Number' }, { emitEvent: false });
        } else {
          numberCtrl.enable({ emitEvent: false });
          if (this.uiMode() === 'create') {
            form.patchValue({ number: '' }, { emitEvent: false });
          }
        }
      });
  }

  ngOnInit(): void {
    this.initializeAutoNumbering();
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

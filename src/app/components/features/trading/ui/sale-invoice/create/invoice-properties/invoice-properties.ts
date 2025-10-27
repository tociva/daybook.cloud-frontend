import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { SaleInvoicePropertiesForm } from '../../util/sale-invoice-form.type';
import { CurrencyStore } from '../../../../../../shared/store/currency/currency.store';
import { Currency } from '../../../../../../shared/store/currency/currency.model';
import { TaxGroupModeStore } from '../../../../store/tax-group/tax-group.store';
import { currencyActions } from '../../../../../../shared/store/currency/currency.action';
import { Store } from '@ngrx/store';
import { TextInputDirective } from '../../../../../../../util/directives/text-input.directive';
import { distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { taxGroupActions } from '../../../../store/tax-group/tax-group.actions';

@Component({
  selector: 'app-invoice-properties',
  imports: [ReactiveFormsModule, AutoComplete, DbcSwitch, TextInputDirective],
  templateUrl: './invoice-properties.html',
  styleUrl: './invoice-properties.css'
})
export class InvoiceProperties {

  private readonly store = inject(Store);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly taxGroupModeStore = inject(TaxGroupModeStore);

  readonly form = input.required<FormGroup<SaleInvoicePropertiesForm>>();
  readonly uiMode = input.required<string>();

  currencies = signal<Currency[]>([]);
  modes = this.taxGroupModeStore.items;
  filteredModes = signal<string[]>([]);

  readonly autoNumberingSig = toSignal(
    toObservable(this.form).pipe(
      switchMap(form => {
        const ctrl = form?.get('autoNumbering') as FormControl<boolean> | null;
        return ctrl
          ? ctrl.valueChanges.pipe(
              startWith(ctrl.value),
              distinctUntilChanged()
            )
          : of<boolean>(true);
      })
    ),
    { initialValue: true }
  );
  
  private changeFormEffect = effect(() => {
    const autoNumbering = this.autoNumberingSig();
    if(autoNumbering) {
      this.form().patchValue({ number: 'Auto Number' });
      this.form().controls.number.disable();
    }else{
      this.form().controls.number.enable();
      if(this.uiMode() === 'create') {
        this.form().patchValue({ number: '' });
      }
    }
  });

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

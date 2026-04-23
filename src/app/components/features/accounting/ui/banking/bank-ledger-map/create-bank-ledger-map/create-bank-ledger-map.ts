import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { buildFormKey } from '../../../../../../../util/common.util';
import { FormValidator } from '../../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../../util/form/validation.uti';
import { WithFormDraftBinding } from '../../../../../../../util/form/with-form-draft-binding';
import { FormField } from '../../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { fiscalYearActions } from '../../../../../management/store/fiscal-year/fiscal-year.actions';
import { bankCashActions } from '../../../../../trading/store/bank-cash/bank-cash.actions';
import { BankCash } from '../../../../../trading/store/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../../../trading/store/bank-cash/bank-cash.store';
import { BankCashLedgerMap, BankCashLedgerMapCU, bankLedgerMapActions, BankLedgerMapStore } from '../../../../store/bank-ledger-map';
import { ledgerActions } from '../../../../store/ledger/ledger.actions';
import { Ledger } from '../../../../store/ledger/ledger.model';
import { LedgerStore } from '../../../../store/ledger/ledger.store';

@Component({
  selector: 'app-create-bank-ledger-map',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-bank-ledger-map.html',
  styleUrl: './create-bank-ledger-map.css'
})
export class CreateBankLedgerMap extends WithFormDraftBinding implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly bankLedgerMapStore = inject(BankLedgerMapStore);
  readonly bankCashStore = inject(BankCashStore);
  readonly ledgerStore = inject(LedgerStore);
  readonly selectedBankLedgerMap = this.bankLedgerMapStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('bank-ledger-map', this.mode(), this.itemId()));

  bankCashes = this.bankCashStore.items;
  ledgers = this.ledgerStore.items;

  readonly formFields = signal<FormField[]>([
    
    { 
      key: 'bankcash', 
      label: 'Bank/Cash', 
      type: 'auto-complete', 
      required: true, 
      group: 'Basic Details',
      placeholder: 'Search for a bank/cash',
      autoComplete: {
        items: this.bankCashes,
        optionDisplayValue: (item: BankCash) => item.name,
        inputDisplayValue: (item: BankCash) => item.name,
        trackBy: (item: BankCash) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(bankCashActions.loadBankCashes({ query: { search: [{query: value, fields: ['name', 'description']}] } }));
        }
      },
      validators: (value: unknown) => {
        if (!willPassRequiredStringValidation((value as BankCash).id)) {
          return ['Bank/Cash is required'];
        }
        return [];
      }
    },
    { 
      key: 'ledger', 
      label: 'Ledger', 
      type: 'auto-complete', 
      required: true, 
      group: 'Basic Details',
      placeholder: 'Search for a ledger',
      autoComplete: {
        items: this.ledgers,
        optionDisplayValue: (item: Ledger) => item.name,
        inputDisplayValue: (item: Ledger) => item.name,
        trackBy: (item: Ledger) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(ledgerActions.loadLedgers({ query: { search: [{query: value, fields: ['name', 'description']}] } }));
        }
      },
      validators: (value: unknown) => {
        if (!willPassRequiredStringValidation((value as Ledger).id)) {
          return ['Ledger is required'];
        }
        return [];
      }
    },
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Bank Ledger Map Setup');

  private fillFormEffect = effect(() => {
    const bankLedgerMap = this.selectedBankLedgerMap();
    if (bankLedgerMap) {
      this.form.patchValue({
        ...bankLedgerMap,
        fiscalyearid: bankLedgerMap.fiscalyear?.id,
        bankcashid: bankLedgerMap.bankcash?.id,
        ledgerid: bankLedgerMap.ledger?.id
      });
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.bankLedgerMapStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });
  
  private readonly binder = this.bindFormToDraft<BankCashLedgerMap>(
    this.form,
    this.formKey,
    {
      selected: this.selectedBankLedgerMap,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );
  
  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(bankLedgerMapActions.createBankLedgerMapSuccess);
      this.failureAction.set(bankLedgerMapActions.createBankLedgerMapFailure);
      this.loading = false;
      // Load data for dropdowns
      this.store.dispatch(fiscalYearActions.loadFiscalYears({ query: {} }));
      this.store.dispatch(bankCashActions.loadBankCashes({ query: {} }));
      this.store.dispatch(ledgerActions.loadLedgers({ query: {} }));
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(bankLedgerMapActions.updateBankLedgerMapSuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(bankLedgerMapActions.loadBankLedgerMapById({ id: this.itemId()!, query: { includes: ['fiscalyear', 'bankcash', 'ledger'] } }));
        this.store.dispatch(fiscalYearActions.loadFiscalYears({ query: {} }));
        this.store.dispatch(bankCashActions.loadBankCashes({ query: {} }));
        this.store.dispatch(ledgerActions.loadLedgers({ query: {} }));
      }else{
        this.loading = false;
      }
    }
  }

  ngOnDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: BankCashLedgerMap) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const {bankcash, ledger} = dataP;

    const bankLedgerMap: BankCashLedgerMapCU = {
      bankcashid: bankcash!.id!,
      ledgerid: ledger!.id!,
    };

    if(this.mode() === 'create') {
      this.store.dispatch(bankLedgerMapActions.createBankLedgerMap({ bankLedgerMap }));
    }else{
      this.store.dispatch(bankLedgerMapActions.updateBankLedgerMap({ id: this.itemId()!, bankLedgerMap }));
    }
    this.binder.clear();

  }
}


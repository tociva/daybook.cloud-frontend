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
import { bankCashActions } from '../../../../../trading/store/bank-cash/bank-cash.actions';
import { BankCash } from '../../../../../trading/store/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../../../trading/store/bank-cash/bank-cash.store';
import { bankLedgerMapActions, BankLedgerMapStore } from '../../../../store/bank-ledger-map';
import { BankTxn, bankTxnActions, BankTxnCU, BankTxnStore } from '../../../../store/bank-txn';

type BankTxnFormRecord = {
  bank: BankCash;
  txndate: Date;
  debit: number;
  credit: number;
  bankref: string;
  description: string;
};

@Component({
  selector: 'app-create-bank-txn',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-bank-txn.html',
  styleUrl: './create-bank-txn.css'
})
export class CreateBankTxn extends WithFormDraftBinding implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly bankTxnStore = inject(BankTxnStore);
  readonly bankCashStore = inject(BankCashStore);
  readonly bankLedgerMapStore = inject(BankLedgerMapStore);
  readonly selectedBankTxn = this.bankTxnStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('bank-txn', this.mode(), this.itemId()));

  bankCashes = this.bankCashStore.items;
  bankLedgerMaps = this.bankLedgerMapStore.items;
  readonly formFields = signal<FormField[]>([
    { 
      key: 'bank', 
      label: 'Bank/Cash', 
      type: 'auto-complete', 
      required: true, 
      group: 'Transaction Details',
      placeholder: 'Search for a bank/cash',
      autoComplete: {
        items: this.bankCashes,
        optionDisplayValue: (item: BankCash) => item.name,
        inputDisplayValue: (item: BankCash) => item.name,
        trackBy: (item: BankCash) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(bankCashActions.loadBankCashes({ query: { search: [{query: value, fields: ['name']}] } }));
        }
      },
      validators: (value: unknown) => {
        if (!willPassRequiredStringValidation((value as BankCash).id)) {
          return ['Bank/Cash is required'];
        }
        const bankLedgerMap = this.bankLedgerMaps().find(map => map.bankcashid === (value as BankCash).id);
        if(!bankLedgerMap) {
          return ['Bank/Cash is not mapped to a ledger'];
        } 
        return [];
      }
    },
    { 
      key: 'txndate', 
      label: 'Transaction Date', 
      type: 'date', 
      required: true, 
      group: 'Transaction Details',
      validators: (value: unknown) => {
        if (!value) {
          return ['Transaction Date is required'];
        }
        return [];
      }
    },
    { 
      key: 'debit', 
      label: 'Debit', 
      type: 'number', 
      required: false, 
      group: 'Transaction Details'
    },
    { 
      key: 'credit', 
      label: 'Credit', 
      type: 'number', 
      required: false, 
      group: 'Transaction Details'
    },
    { 
      key: 'bankref', 
      label: 'Bank Reference', 
      type: 'text', 
      required: false, 
      group: 'Transaction Details'
    },
    { 
      key: 'description', 
      label: 'Description', 
      type: 'text', 
      required: false, 
      group: 'Transaction Details'
    },
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Bank Transaction Setup');

  private fillFormEffect = effect(() => {
    const bankTxn = this.selectedBankTxn();
    if (bankTxn) {
      this.form.patchValue({
        ...bankTxn,
        bankcashledgermapid: bankTxn.bankcashledgermap?.id
      });
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.bankTxnStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });
  
  private readonly binder = this.bindFormToDraft<BankTxn>(
    this.form,
    this.formKey,
    {
      selected: this.selectedBankTxn,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );
  
  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.store.dispatch(bankLedgerMapActions.loadBankLedgerMaps({ query: {} }));

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(bankTxnActions.createBankTxnSuccess);
      this.failureAction.set(bankTxnActions.createBankTxnFailure);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(bankTxnActions.updateBankTxnSuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(bankTxnActions.loadBankTxnById({ id: this.itemId()!, query: { includes: ['bankcashledgermap', 'fiscalyear'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  ngOnDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: BankTxnFormRecord) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const {bank, txndate, description, debit, credit, bankref} = dataP;
    const bankLedgerMap = this.bankLedgerMaps().find(map => map.bankcashid === bank.id);
    const bankTxn: BankTxnCU = {
      bankcashledgermapid: bankLedgerMap?.id!,
      txndate: txndate instanceof Date ? txndate.toISOString().split('T')[0] : txndate,
      ...(description && { description }),
      ...(debit !== undefined && debit !== null && { debit: Number(debit) }),
      ...(credit !== undefined && credit !== null && { credit: Number(credit) }),
      ...(bankref && { bankref }),
    };

    if(this.mode() === 'create') {
      this.store.dispatch(bankTxnActions.createBankTxn({ bankTxn }));
    }else{
      this.store.dispatch(bankTxnActions.updateBankTxn({ id: this.itemId()!, bankTxn }));
    }
    this.binder.clear();

  }
}


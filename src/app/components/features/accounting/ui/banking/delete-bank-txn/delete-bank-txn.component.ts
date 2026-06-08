import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BankTxnFacade, BankTxnStore } from '../../../data/bank-txn';

@Component({
  selector: 'app-delete-bank-txn',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-bank-txn.component.html',
  styleUrl: './delete-bank-txn.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteBankTxnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BankTxnFacade);
  protected readonly bankTxnStore = inject(BankTxnStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly bankCashStore = inject(BankCashStore);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly confirmed = signal(false);

  private readonly bankNameByMapId = computed(() => {
    const banksById = new Map(this.bankCashStore.items().map((item) => [item.id, item.name]));
    return new Map(
      this.inventoryLedgerMapStore
        .items()
        .filter((map) => map.id)
        .map((map) => [
          map.id as string,
          map.entityid ? (banksById.get(map.entityid) ?? map.entityid) : (map.id as string),
        ]),
    );
  });

  constructor() {
    void this.loadInitialState();
  }

  protected async deleteBankTxn(): Promise<void> {
    const id = this.bankTxnStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }

  protected bankName(mapId: string): string {
    return this.bankNameByMapId().get(mapId) ?? mapId;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected transactionAmountLabel(): string {
    const txn = this.bankTxnStore.selectedItem();
    if (!txn) return '';
    const debit = Number(txn.debit ?? 0);
    const credit = Number(txn.credit ?? 0);
    const value = debit > 0 ? debit : credit;
    const direction = debit > 0 ? 'inflow' : 'outflow';
    const amount = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
    return `${direction} ${amount}`;
  }

  private async loadInitialState(): Promise<void> {
    this.bankTxnStore.clearError();

    await Promise.all([
      this.inventoryLedgerMapStore.loadInventoryLedgerMaps({
        limit: 1000,
        offset: 0,
        where: { entitytype: 'bankCash', ledgertype: 'bank' },
      }),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.bankTxnStore.loadBankTxnById(id, { includes: ['inventoryledgermap'] });
    }
  }
}

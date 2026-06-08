import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BankTxnStore } from '../../../data/bank-txn';

@Component({
  selector: 'app-view-bank-txn',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-bank-txn.component.html',
  styleUrl: './view-bank-txn.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewBankTxnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly bankTxnStore = inject(BankTxnStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly bankCashStore = inject(BankCashStore);
  private readonly dateManagement = inject(DateManagementService);

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

  protected edit(): void {
    const id = this.bankTxnStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/accounting/banking', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected delete(): void {
    const id = this.bankTxnStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/accounting/banking', id, 'delete'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected bankName(mapId: string): string {
    return this.bankNameByMapId().get(mapId) ?? mapId;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    const amount = Number(value ?? 0);
    return amount > 0
      ? new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(amount)
      : '-';
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
      await this.bankTxnStore.loadBankTxnById(id, { includes: ['inventoryledgermap', 'matches'] });
    }
  }
}

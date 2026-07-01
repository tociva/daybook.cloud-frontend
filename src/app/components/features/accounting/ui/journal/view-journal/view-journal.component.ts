import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { JournalStore } from '../../../data/journal';
import type { JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { JournalCreateDraftStagingService } from '../create-journal/journal-create-draft-staging.service';
import { InvoiceDocumentTagsComponent } from '../../../../trading/ui/shared/invoice-document-tags/invoice-document-tags.component';

@Component({
  selector: 'app-view-journal',
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
    TngButtonComponent,
    TngIcon,
    InvoiceDocumentTagsComponent,
  ],
  templateUrl: './view-journal.component.html',
  styleUrl: './view-journal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewJournalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);
  private readonly burlNavigation = inject(BurlNavigationService);
  private readonly draftStaging = inject(JournalCreateDraftStagingService);
  protected readonly journalStore = inject(JournalStore);
  protected readonly ledgerStore = inject(LedgerStore);
  private readonly dateManagement = inject(DateManagementService);

  protected readonly canClone = computed(() => {
    const journal = this.journalStore.selectedItem();
    return (
      this.permissions.can(PERMISSION.fiscalYear.journal.create) &&
      !this.journalStore.isLoading() &&
      (journal?.entries?.length ?? 0) > 0
    );
  });

  protected readonly ledgerById = computed(() => {
    const map = new Map<string, Ledger>();
    for (const l of this.ledgerStore.items()) {
      if (l.id) map.set(l.id, l);
    }
    return map;
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.journalStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    if (this.journalStore.selectedItem()?.id !== id) {
      await this.journalStore.loadJournalById(id, { includes: ['entries', 'documents'] });
    }

    const journal = this.journalStore.selectedItem();
    const ids = [...new Set((journal?.entries ?? []).map((e) => e.ledgerid).filter(Boolean))];
    if (ids.length > 0 && this.permissions.can(PERMISSION.fiscalYear.ledger.view)) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: ids } },
        limit: Math.max(ids.length, 10),
        includes: ['category'],
      });
    }
  }

  protected ledgerName(ledgerid: string): string {
    return this.ledgerById().get(ledgerid)?.name ?? ledgerid;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected sortedEntries(entries: readonly JournalEntry[] | undefined): readonly JournalEntry[] {
    const list = [...(entries ?? [])];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  }

  protected edit(): void {
    const id = this.journalStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/accounting/journal', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected async clone(): Promise<void> {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.create)) return;
    const journal = this.journalStore.selectedItem();
    if (!journal?.entries?.length) return;

    await this.draftStaging.stageFromJournal(journal);
    void this.router.navigate(['/app/accounting/journal/create'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected delete(): void {
    const id = this.journalStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/accounting/journal', id, 'delete'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}

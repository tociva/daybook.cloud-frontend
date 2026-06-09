import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import type { StoredDocument } from '../../../../trading/data/invoice-document';
import { InvoiceDocumentService } from '../../../../trading/data/invoice-document';
import { BankTxnStore } from '../../../data/bank-txn';
import { JournalFacade, JournalStore } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import { JournalDetailsComponent } from './journal-details/journal-details.component';
import { JournalDraftStore } from './journal-draft.store';
import { JournalEntriesComponent } from './journal-entries/journal-entries.component';

@Component({
  selector: 'app-create-journal',
  standalone: true,
  providers: [JournalDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    JournalDetailsComponent,
    JournalEntriesComponent,
  ],
  templateUrl: './create-journal.component.html',
  styleUrl: './create-journal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateJournalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(JournalFacade);
  private readonly documentService = inject(InvoiceDocumentService);
  private readonly toastStore = inject(ToastStore);
  private readonly navigation = inject(BurlNavigationService);
  protected readonly journalStore = inject(JournalStore);
  private readonly bankTxnStore = inject(BankTxnStore);
  private readonly ledgerStore = inject(LedgerStore);
  protected readonly draft = inject(JournalDraftStore);

  protected readonly id = signal<string | null>(null);
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly deletingDocumentId = signal<string | null>(null);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit journal' : 'New journal',
  );
  protected readonly isSaving = computed(
    () =>
      this.journalStore.isLoading() ||
      this.isUploadingDocuments() ||
      this.deletingDocumentId() !== null,
  );
  protected readonly selectedDocuments = computed(() => {
    const item = this.journalStore.selectedItem();
    if (!item || item.id !== this.id()) return [] as readonly StoredDocument[];
    return item.documents ?? [];
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.journalStore.clearError();
    await this.ledgerStore.loadLedgers({ limit: 50, includes: ['category'] });

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.journalStore.clearSelectedItem();

      const bankTxnId = this.route.snapshot.queryParamMap.get('banktxnid')?.trim();
      if (bankTxnId) {
        const txn = await this.bankTxnStore.loadBankTxnById(bankTxnId, {
          includes: ['inventoryledgermap'],
        });
        if (txn) {
          await this.draft.hydrateFromBankTxn(txn);
        }
      }
      return;
    }

    const cached = this.journalStore.selectedItem();
    if (cached?.id === id && cached.entries && cached.entries.length > 0) {
      await this.draft.hydrateFromJournal(cached);
      return;
    }

    const journal = await this.journalStore.loadJournalById(id, {
      includes: ['entries', 'documents'],
    });
    if (journal) {
      await this.draft.hydrateFromJournal(journal);
    }
  }

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);

    if (this.draft.dateError() || !this.draft.canSave()) return;

    const v = this.draft.validatedEntries();
    if (!v.ok) return;

    const number = this.draft.journalNumber().trim();
    const includeNumber =
      this.mode() === 'edit' ? !!number : !this.draft.autoNumbering() && !!number;

    const payload = {
      date: this.draft.journalDateModel().trim(),
      ...(includeNumber ? { number } : {}),
      ...(this.draft.journalDescription().trim()
        ? { description: this.draft.journalDescription().trim() }
        : {}),
      entries: v.entries,
    };

    const currentId = this.id();
    let saved = false;
    let savedId = currentId;
    if (currentId) {
      saved = await this.facade.update(currentId, payload, { navigateBack: false });
    } else {
      const created = await this.facade.create(payload, { navigateBack: false });
      saved = !!created;
      savedId = created?.id ?? null;
      if (savedId) this.id.set(savedId);
    }
    if (!saved) return;
    if (!(await this.attachPendingDocuments(savedId))) return;
    await this.navigation.navigateBack();
  }

  protected async deleteDocument(document: StoredDocument): Promise<void> {
    const parentId = this.id();
    const documentId = document.id;
    if (!parentId || !documentId || this.deletingDocumentId()) return;
    if (!window.confirm(`Remove ${document.name}?`)) return;

    this.deletingDocumentId.set(documentId);
    try {
      await this.documentService.deleteInvoiceDocument('journal', parentId, documentId);
      const selected = this.journalStore.selectedItem();
      if (selected) {
        const documents = (selected.documents ?? []).filter((item) => item.id !== documentId);
        this.journalStore.setSelectedItem({
          ...selected,
          documentids: documents.map((item) => item.id).filter((id): id is string => !!id),
          documents,
        });
      }
      this.toastStore.success('Document removed.');
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to remove document.'));
    } finally {
      this.deletingDocumentId.set(null);
    }
  }

  private async attachPendingDocuments(parentId: string | null): Promise<boolean> {
    const files = this.pendingDocumentFiles();
    if (!files.length) return true;
    if (!parentId) {
      this.toastStore.danger('Journal saved, but documents could not be attached.');
      return false;
    }

    this.isUploadingDocuments.set(true);
    try {
      const created = await this.documentService.attachInvoiceDocuments('journal', parentId, files);
      this.pendingDocumentFiles.set([]);

      const selected = this.journalStore.selectedItem();
      if (selected) {
        const documents = [...(selected.documents ?? []), ...created];
        this.journalStore.setSelectedItem({
          ...selected,
          documentids: documents.map((item) => item.id).filter((id): id is string => !!id),
          documents,
        });
      }
      this.toastStore.success(files.length === 1 ? 'Document attached.' : 'Documents attached.');
      return true;
    } catch (error) {
      this.toastStore.danger(
        getApiErrorMessage(error, 'Journal saved, but documents could not be attached.'),
      );
      return false;
    } finally {
      this.isUploadingDocuments.set(false);
    }
  }
}

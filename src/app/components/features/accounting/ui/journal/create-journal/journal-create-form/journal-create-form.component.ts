import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { getApiErrorMessage } from '../../../../../../../core/api/api-error.util';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';
import { ToastStore } from '../../../../../../../core/toast/toast.store';
import type { StoredDocument } from '../../../../../trading/data/invoice-document';
import { InvoiceDocumentService } from '../../../../../trading/data/invoice-document';
import { CurrencyStore } from '../../../../../management/data/currency/currency.store';
import { JournalStore } from '../../../../data/journal';
import type { Journal, JournalCreatePayload } from '../../../../data/journal';
import { LedgerStore } from '../../../../data/ledger';
import { JournalCreateDraftStagingService } from '../journal-create-draft-staging.service';
import { JournalDetailsComponent } from '../journal-details/journal-details.component';
import { JournalDraftStore, type JournalCreateSnapshot } from '../journal-draft.store';
import { JournalEntriesComponent } from '../journal-entries/journal-entries.component';

@Component({
  selector: 'app-journal-create-form',
  standalone: true,
  providers: [JournalDraftStore],
  imports: [JournalDetailsComponent, JournalEntriesComponent],
  templateUrl: './journal-create-form.component.html',
  styleUrl: './journal-create-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalCreateFormComponent {
  private readonly documentService = inject(InvoiceDocumentService);
  private readonly permissions = inject(PermissionsStore);
  private readonly toastStore = inject(ToastStore);
  protected readonly journalStore = inject(JournalStore);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly draftStaging = inject(JournalCreateDraftStagingService);
  protected readonly draft = inject(JournalDraftStore);

  readonly journalId = input<string | null>(null);

  private readonly resolvedId = signal<string | null>(null);
  private createPrefillApplied = false;
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly deletingDocumentId = signal<string | null>(null);

  readonly mode = computed(() => (this.resolvedId() ? 'edit' : 'create'));
  readonly isBusy = computed(
    () => this.isUploadingDocuments() || this.deletingDocumentId() !== null,
  );
  protected readonly selectedDocuments = computed(() => {
    const item = this.journalStore.selectedItem();
    const id = this.resolvedId();
    if (!item || item.id !== id) return [] as readonly StoredDocument[];
    return item.documents ?? [];
  });

  constructor() {
    effect(() => {
      const journalId = this.journalId();
      untracked(() => {
        void this.loadInitialState(journalId);
      });
    });
  }

  resolvedJournalId(): string | null {
    return this.resolvedId();
  }

  buildCloneSnapshot(): JournalCreateSnapshot {
    return this.draft.buildCloneSnapshot();
  }

  rememberJournalDate(): void {
    this.draft.rememberJournalDate();
  }

  buildPayload(): JournalCreatePayload | null {
    this.draft.submitted.set(true);

    if (this.draft.dateError() || !this.draft.canSave()) return null;

    const v = this.draft.validatedEntries();
    if (!v.ok) return null;

    const number = this.draft.journalNumber().trim();
    const includeNumber =
      this.mode() === 'edit' ? !!number : !this.draft.autoNumbering() && !!number;

    return {
      date: this.draft.journalDateModel().trim(),
      ...(includeNumber ? { number } : {}),
      ...(this.draft.journalDescription().trim()
        ? { description: this.draft.journalDescription().trim() }
        : {}),
      entries: v.entries,
    };
  }

  async attachPendingDocuments(
    parentId: string | null,
    journal?: Journal | null,
  ): Promise<boolean> {
    if (journal) {
      this.journalStore.setSelectedItem(journal);
      if (journal.id) this.resolvedId.set(journal.id);
    }

    const files = this.pendingDocumentFiles();
    if (!files.length) return true;
    if (!this.permissions.can(PERMISSION.fiscalYear.journalDocument.create)) return false;
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

  protected async deleteDocument(document: StoredDocument): Promise<void> {
    if (!this.permissions.can(PERMISSION.fiscalYear.journalDocument.delete)) return;
    const parentId = this.resolvedId();
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

  private async loadInitialState(journalId: string | null): Promise<void> {
    this.journalStore.clearError();
    this.resolvedId.set(journalId);
    await Promise.all([
      this.ledgerStore.loadLedgers({ limit: 50, includes: ['category'] }),
      this.currencyStore.load(),
    ]);

    if (!journalId) {
      this.journalStore.clearSelectedItem();
      if (!this.createPrefillApplied) {
        this.createPrefillApplied = true;
        const staged = this.draftStaging.consume();
        if (staged) {
          this.draft.applyCreateSnapshot(staged);
        } else {
          this.draft.resetForCreate();
        }
      }
      return;
    }

    const cached = this.journalStore.selectedItem();
    if (cached?.id === journalId && cached.entries && cached.entries.length > 0) {
      await this.draft.hydrateFromJournal(cached);
      return;
    }

    const journal = await this.journalStore.loadJournalById(journalId, {
      includes: ['entries', 'documents'],
    });
    if (journal) {
      await this.draft.hydrateFromJournal(journal);
    }
  }
}

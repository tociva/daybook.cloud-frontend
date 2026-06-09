import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { getApiErrorMessage } from '../../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../../core/toast/toast.store';
import type { StoredDocument } from '../../../../../trading/data/invoice-document';
import { InvoiceDocumentService } from '../../../../../trading/data/invoice-document';
import { JournalFacade, JournalStore } from '../../../../data/journal';
import type { Journal } from '../../../../data/journal';
import { LedgerStore } from '../../../../data/ledger';
import { JournalCreateDraftStagingService } from '../journal-create-draft-staging.service';
import { JournalDetailsComponent } from '../journal-details/journal-details.component';
import { JournalDraftStore } from '../journal-draft.store';
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
  private readonly facade = inject(JournalFacade);
  private readonly documentService = inject(InvoiceDocumentService);
  private readonly toastStore = inject(ToastStore);
  protected readonly journalStore = inject(JournalStore);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly draftStaging = inject(JournalCreateDraftStagingService);
  protected readonly draft = inject(JournalDraftStore);

  readonly journalId = input<string | null>(null);

  readonly saved = output<Journal>();

  private readonly resolvedId = signal<string | null>(null);
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly deletingDocumentId = signal<string | null>(null);

  readonly mode = computed(() => (this.resolvedId() ? 'edit' : 'create'));
  readonly isSaving = computed(
    () =>
      this.journalStore.isLoading() ||
      this.isUploadingDocuments() ||
      this.deletingDocumentId() !== null,
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

  async submit(): Promise<Journal | null> {
    this.draft.submitted.set(true);

    if (this.draft.dateError() || !this.draft.canSave()) return null;

    const v = this.draft.validatedEntries();
    if (!v.ok) return null;

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

    const currentId = this.resolvedId();
    let savedJournal: Journal | null = null;
    let savedId = currentId;

    if (currentId) {
      const saved = await this.facade.update(currentId, payload, { navigateBack: false });
      savedJournal = saved ? (this.journalStore.selectedItem() ?? null) : null;
    } else {
      savedJournal = await this.facade.create(payload, { navigateBack: false });
      savedId = savedJournal?.id ?? null;
      if (savedId) this.resolvedId.set(savedId);
    }

    if (!savedJournal) return null;
    if (!(await this.attachPendingDocuments(savedId))) return null;

    this.saved.emit(savedJournal);
    return savedJournal;
  }

  protected async deleteDocument(document: StoredDocument): Promise<void> {
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
    await this.ledgerStore.loadLedgers({ limit: 50, includes: ['category'] });

    if (!journalId) {
      this.journalStore.clearSelectedItem();
      const staged = this.draftStaging.consume();
      if (staged) {
        this.draft.applyCreateSnapshot(staged);
      } else {
        this.draft.resetForCreate();
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

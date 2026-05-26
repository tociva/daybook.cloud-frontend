import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { TngIcon } from '@tailng-ui/icons';
import { InvoiceDocumentService } from '../../../data/invoice-document';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type {
  PurchaseReturnItemRequest,
  PurchaseReturnItemTaxRequest,
  PurchaseReturnPayload,
} from '../../../data/purchase-return';
import {
  PURCHASE_RETURN_DETAIL_INCLUDES,
  PurchaseReturnFacade,
  PurchaseReturnStore,
} from '../../../data/purchase-return';
import { PurchaseReturnDraftStore, toNum } from './purchase-return-draft.store';
import { PrInvoiceRefComponent } from './pr-invoice-ref/pr-invoice-ref.component';
import { PrReturnDetailsComponent } from './pr-return-details/pr-return-details.component';
import { PrLineItemsComponent } from './pr-line-items/pr-line-items.component';

@Component({
  selector: 'app-create-purchase-return',
  standalone: true,
  providers: [PurchaseReturnDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    TngIcon,
    TngFileUploadDirective,
    PrInvoiceRefComponent,
    PrLineItemsComponent,
    PrReturnDetailsComponent,
  ],
  templateUrl: './create-purchase-return.component.html',
  styleUrl: './create-purchase-return.component.css',
})
export class CreatePurchaseReturnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseReturnFacade);
  private readonly invoiceDocumentService = inject(InvoiceDocumentService);
  private readonly navigation = inject(BurlNavigationService);
  private readonly toastStore = inject(ToastStore);

  protected readonly purchaseReturnStore = inject(PurchaseReturnStore);
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);

  protected readonly draft = inject(PurchaseReturnDraftStore);

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly isSaving = computed(
    () => this.purchaseReturnStore.isLoading() || this.isUploadingDocuments(),
  );
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Purchase Return' : 'New Purchase Return',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  protected onDocumentFilesSelected(event: TngFileUploadSelectedEvent): void {
    this.addPendingDocumentFiles(event.files);
  }

  protected onDocumentFilesRejected(event: TngFileUploadRejectedEvent): void {
    const first = event.rejected[0];
    this.toastStore.warning(first?.message ?? 'Some files could not be attached.');
    if (event.accepted.length) {
      this.addPendingDocumentFiles(event.accepted);
    }
  }

  protected addPendingDocumentFiles(files: readonly File[]): void {
    const existing = this.pendingDocumentFiles();
    const merged = [...existing];
    for (const file of files) {
      if (file.size <= 0) continue;
      const duplicate = merged.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );
      if (!duplicate) merged.push(file);
    }
    this.pendingDocumentFiles.set(merged);
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseReturnStore.clearError();

    await this.purchaseInvoiceStore.loadPurchaseInvoices({ includes: ['vendor'] });

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const cached = this.purchaseReturnStore.selectedItem();
      if (cached?.id === id) this.draft.patchFromReturn(cached);

      const ret = await this.purchaseReturnStore.loadPurchaseReturnById(id, {
        includes: PURCHASE_RETURN_DETAIL_INCLUDES,
      });
      if (ret) {
        this.draft.patchFromReturn(ret);
        const invoiceId = ret.purchaseinvoiceid ?? ret.purchaseinvoice?.id;
        if (invoiceId) await this.draft.mergeInvoiceItemsForEdit(invoiceId);
      }
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (!this.draft.purchaseinvoiceid() || this.draft.dateError() !== null) return;

    const returnRows = this.draft.items().filter((row) => row.itemid && toNum(row.quantity) > 0);

    const items: PurchaseReturnItemRequest[] = returnRows.map((row, i) => {
      const taxes: PurchaseReturnItemTaxRequest[] = row.taxes.map((t) => ({
        name: t.name,
        shortname: t.shortname,
        rate: toNum(t.rate),
        appliedto: toNum(t.appliedto),
        amount: toNum(t.amount),
        ...(t.taxid ? { taxid: t.taxid } : {}),
      }));
      const displayname = row.item?.displayname ?? row.item?.name ?? row.name ?? '';

      return {
        name: row.name,
        displayname,
        description: row.description,
        code: row.code,
        order: i + 1,
        price: toNum(row.price),
        quantity: toNum(row.quantity),
        itemtotal: toNum(row.itemtotal),
        taxamount: toNum(row.taxamount),
        grandtotal: toNum(row.grandtotal),
        itemid: row.itemid,
        taxes,
      };
    });

    const payload: PurchaseReturnPayload = {
      ...(this.draft.number() ? { number: this.draft.number() } : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      description: this.draft.description(),
      purchaseinvoiceid: this.draft.purchaseinvoiceid(),
      items,
      cprops: {
        showdescription: this.draft.showDescription(),
        taxoption: this.draft.taxoption(),
      },
    };

    const id = this.id();
    let savedId = id;
    let saved = false;
    if (id) {
      saved = await this.facade.update(id, payload, { navigateBack: false });
    } else {
      const purchaseReturn = await this.facade.create(payload, { navigateBack: false });
      savedId = purchaseReturn?.id ?? null;
      saved = !!purchaseReturn;
      if (savedId) this.id.set(savedId);
    }

    if (!saved) return;
    if (!(await this.attachPendingDocuments(savedId))) return;
    await this.navigation.navigateBack();
  }

  private async attachPendingDocuments(parentId: string | null): Promise<boolean> {
    const files = this.pendingDocumentFiles();
    if (!files.length) return true;
    if (!parentId) {
      this.toastStore.danger('Purchase return saved, but documents could not be attached.');
      return false;
    }

    this.isUploadingDocuments.set(true);
    try {
      await this.invoiceDocumentService.attachInvoiceDocuments('purchaseReturn', parentId, files);
      this.pendingDocumentFiles.set([]);
      this.toastStore.success(files.length === 1 ? 'Document attached.' : 'Documents attached.');
      return true;
    } catch (error) {
      this.toastStore.danger(
        getApiErrorMessage(error, 'Purchase return saved, but documents could not be attached.'),
      );
      return false;
    } finally {
      this.isUploadingDocuments.set(false);
    }
  }
}

import { Component, ViewChild, computed, inject, signal } from '@angular/core';
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
import { TngSkeletonComponent } from '@tailng-ui/components';
import { VendorStore } from '../../../data/vendor';
import type { VendorListQuery } from '../../../data/vendor';
import { InvoiceDocumentService } from '../../../data/invoice-document';
import { ItemStore } from '../../../data/item';
import type {
  PurchaseInvoiceItemRequest,
  PurchaseInvoiceItemTaxRequest,
  PurchaseInvoicePayload,
  VendorAddress,
} from '../../../data/purchase-invoice';
import {
  PURCHASE_INVOICE_DETAIL_INCLUDES,
  PurchaseInvoiceFacade,
  PurchaseInvoiceStore,
} from '../../../data/purchase-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { PurchaseInvoiceDraftStore, toNum } from './purchase-invoice-draft.store';
import { PiVendorComponent } from './pi-vendor/pi-vendor.component';
import { PiInvoiceDetailsComponent } from './pi-invoice-details/pi-invoice-details.component';
import { PiLineItemsComponent } from './pi-line-items/pi-line-items.component';

@Component({
  selector: 'app-create-purchase-invoice',
  standalone: true,
  providers: [PurchaseInvoiceDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    TngIcon,
    TngFileUploadDirective,
    TngSkeletonComponent,
    PiVendorComponent,
    PiLineItemsComponent,
    PiInvoiceDetailsComponent,
  ],
  templateUrl: './create-purchase-invoice.component.html',
  styleUrl: './create-purchase-invoice.component.css',
})
export class CreatePurchaseInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseInvoiceFacade);
  private readonly invoiceDocumentService = inject(InvoiceDocumentService);
  private readonly navigation = inject(BurlNavigationService);
  private readonly toastStore = inject(ToastStore);

  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly vendorStore = inject(VendorStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);

  protected readonly draft = inject(PurchaseInvoiceDraftStore);

  @ViewChild(PiLineItemsComponent) private lineItemsRef?: PiLineItemsComponent;

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isInitialLoading = signal(true);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly isSaving = computed(
    () =>
      this.isInitialLoading() ||
      this.purchaseInvoiceStore.isLoading() ||
      this.isUploadingDocuments(),
  );
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Purchase Invoice' : 'New Purchase Invoice',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseInvoiceStore.clearError();

    try {
      await Promise.all([
        this.vendorStore.loadVendors(this.initialVendorQuery()),
        this.itemStore.loadItems({ includes: ['category'] }),
        this.taxGroupStore.ensureTaxGroupCatalogLoaded(),
        this.taxStore.ensureTaxCatalogLoaded(),
      ]);
      this.draft.markAllItemsLoaded();

      const id = this.route.snapshot.paramMap.get('id');
      this.id.set(id);

      if (id) {
        const cached = this.purchaseInvoiceStore.selectedItem();
        if (cached?.id === id) this.draft.patchFromInvoice(cached);

        const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, {
          includes: PURCHASE_INVOICE_DETAIL_INCLUDES,
        });
        if (invoice) this.draft.patchFromInvoice(invoice);
        return;
      }

      this.draft.patchFromGstReconciliation(this.route.snapshot.queryParamMap);
    } finally {
      this.isInitialLoading.set(false);
    }
  }

  private initialVendorQuery(): VendorListQuery {
    const query = this.route.snapshot.queryParamMap;
    const partyGstin = query.get('partyGstin')?.trim();
    const partyName = query.get('partyName')?.trim();

    if (partyGstin) {
      return {
        limit: 20,
        offset: 0,
        where: { gstin: { ilike: partyGstin } },
      };
    }

    if (partyName) {
      return {
        limit: 20,
        offset: 0,
        where: { name: { ilike: partyName } },
      };
    }

    return {};
  }

  // ── Vendor selection ──────────────────────────────────────────────────────

  protected onVendorSelected(): void {
    this.lineItemsRef?.focusItemAutocomplete(0);
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

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (!this.draft.vendorid() || this.draft.dateError() !== null) return;

    const vendoraddress: VendorAddress = {
      name: this.draft.vendorAddressName(),
      line1: this.draft.vendorAddressLine1(),
      ...(this.draft.vendorAddressLine2() ? { line2: this.draft.vendorAddressLine2() } : {}),
      ...(this.draft.vendorAddressCity() ? { city: this.draft.vendorAddressCity() } : {}),
      ...(this.draft.vendorAddressState() ? { state: this.draft.vendorAddressState() } : {}),
      ...(this.draft.vendorAddressZip() ? { zip: this.draft.vendorAddressZip() } : {}),
      ...(this.draft.vendorAddressCountry() ? { country: this.draft.vendorAddressCountry() } : {}),
    };

    const items: PurchaseInvoiceItemRequest[] = this.draft
      .items()
      .filter((row) => !!row.itemid)
      .map((row, i) => {
        const taxes: PurchaseInvoiceItemTaxRequest[] = row.taxes.map((t) => ({
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
          quantity: Math.max(1, toNum(row.quantity)),
          itemtotal: toNum(row.itemtotal),
          discpercent: toNum(row.discpercent),
          discamount: toNum(row.discamount),
          subtotal: toNum(row.subtotal),
          taxamount: toNum(row.taxamount),
          grandtotal: toNum(row.grandtotal),
          itemid: row.itemid,
          taxes,
        };
      });

    const payload: PurchaseInvoicePayload = {
      ...(this.draft.number() ? { number: this.draft.number() } : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      discount: toNum(this.draft.discount()),
      subtotal: toNum(this.draft.subtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      currencycode: this.draft.currencycode(),
      vendoraddress,
      description: this.draft.description(),
      vendorid: this.draft.vendorid(),
      items,
      cprops: {
        showdiscount: this.draft.showDiscount(),
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
      const invoice = await this.facade.create(payload, { navigateBack: false });
      savedId = invoice?.id ?? null;
      saved = !!invoice;
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
      this.toastStore.danger('Invoice saved, but documents could not be attached.');
      return false;
    }

    this.isUploadingDocuments.set(true);
    try {
      await this.invoiceDocumentService.attachInvoiceDocuments('purchaseInvoice', parentId, files);
      this.pendingDocumentFiles.set([]);
      this.toastStore.success(files.length === 1 ? 'Document attached.' : 'Documents attached.');
      return true;
    } catch (error) {
      this.toastStore.danger(
        getApiErrorMessage(error, 'Invoice saved, but documents could not be attached.'),
      );
      return false;
    } finally {
      this.isUploadingDocuments.set(false);
    }
  }
}

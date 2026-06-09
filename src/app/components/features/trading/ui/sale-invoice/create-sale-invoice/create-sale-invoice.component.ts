import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { TngButtonComponent } from '@tailng-ui/components';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { TngIcon } from '@tailng-ui/icons';
import { CustomerStore, type CustomerListQuery } from '../../../data/customer';
import { InvoiceDocumentService, type StoredDocument } from '../../../data/invoice-document';
import { ItemStore } from '../../../data/item';
import type {
  InvoiceAddress,
  SaleInvoiceItemRequest,
  SaleInvoiceItemTaxRequest,
  SaleInvoicePayload,
} from '../../../data/sale-invoice';
import {
  SALE_INVOICE_DETAIL_INCLUDES,
  SaleInvoiceFacade,
  SaleInvoicePrintService,
  SaleInvoiceStore,
} from '../../../data/sale-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { SaleInvoiceDraftStore, toNum } from './sale-invoice-draft.store';
import { SiCustomerComponent } from './si-customer/si-customer.component';
import { SiInvoiceDetailsComponent } from './si-invoice-details/si-invoice-details.component';
import { SiLineItemsComponent } from './si-line-items/si-line-items.component';

@Component({
  selector: 'app-create-sale-invoice',
  standalone: true,
  providers: [SaleInvoiceDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    TngButtonComponent,
    TngIcon,
    TngFileUploadDirective,
    SiCustomerComponent,
    SiLineItemsComponent,
    SiInvoiceDetailsComponent,
  ],
  templateUrl: './create-sale-invoice.component.html',
  styleUrl: './create-sale-invoice.component.css',
})
export class CreateSaleInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(SaleInvoiceFacade);
  private readonly invoiceDocumentService = inject(InvoiceDocumentService);
  private readonly navigation = inject(BurlNavigationService);
  private readonly printService = inject(SaleInvoicePrintService);
  private readonly toastStore = inject(ToastStore);

  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private readonly customerStore = inject(CustomerStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);

  protected readonly draft = inject(SaleInvoiceDraftStore);

  @ViewChild(SiLineItemsComponent) private lineItemsRef?: SiLineItemsComponent;

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly pendingDocumentFiles = signal<readonly File[]>([]);
  protected readonly isPreviewingPdf = signal(false);
  protected readonly isUploadingDocuments = signal(false);
  protected readonly deletingDocumentId = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly isSaving = computed(
    () =>
      this.saleInvoiceStore.isLoading() ||
      this.isUploadingDocuments() ||
      this.deletingDocumentId() !== null,
  );
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Sale Invoice' : 'New Sale Invoice',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.saleInvoiceStore.clearError();

    await Promise.all([
      this.customerStore.loadCustomers(this.initialCustomerQuery()),
      this.itemStore.loadItems({ includes: ['category'] }),
      this.taxGroupStore.loadTaxGroups({}),
      this.taxStore.loadTaxes({}),
    ]);
    // The full item list is now in the store; tell the draft so that the first
    // autocomplete focus doesn't trigger a redundant empty-query fetch.
    this.draft.markAllItemsLoaded();

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      const snapshot = this.draft.restoreAndClearDraft();
      if (snapshot) {
        this.draft.applySnapshot(snapshot);

        // If the user just created a new customer, auto-select it and focus the
        // first line-item autocomplete (customer field is now hidden).
        const newCustomer = this.customerStore.selectedItem();
        this.customerStore.clearSelectedItem();
        if (newCustomer?.id) {
          this.draft.selectCustomer(newCustomer);
          this.lineItemsRef?.focusItemAutocomplete(0);
        }

        // If the user just created a new item, auto-select it into the pending row
        // and focus that row's price input (same UX as normal item selection).
        const newItem = this.itemStore.selectedItem();
        this.itemStore.clearSelectedItem();
        const pendingRow = snapshot.pendingItemRowIndex;
        if (newItem?.id && pendingRow !== null && pendingRow !== undefined) {
          await this.draft.selectItem(newItem, pendingRow);
          this.lineItemsRef?.focusPriceInput(pendingRow);
        }
      }
      this.draft.patchFromGstReconciliation(this.route.snapshot.queryParamMap);
      return;
    }

    if (id) {
      // Instant pre-fill: if the list set selectedItem before navigating, patch
      // the draft immediately so the form isn't blank while the fetch is in flight.
      const cached = this.saleInvoiceStore.selectedItem();
      if (cached?.id === id) this.draft.patchFromInvoice(cached);

      // Always fetch full detail — line items, taxes, addresses are not in the list response.
      const invoice = await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: SALE_INVOICE_DETAIL_INCLUDES,
      });
      if (invoice) this.draft.patchFromInvoice(invoice);
    }
  }

  private initialCustomerQuery(): CustomerListQuery {
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

  // ── Customer selection ────────────────────────────────────────────────────

  protected onCustomerSelected(): void {
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

  protected async previewInvoicePdf(): Promise<void> {
    const id = this.id();
    if (!id || this.isPreviewingPdf()) return;

    this.isPreviewingPdf.set(true);
    try {
      await this.printService.previewInvoicePdf(this.saleInvoiceStore.selectedItem() ?? id);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to prepare invoice PDF.'));
    } finally {
      this.isPreviewingPdf.set(false);
    }
  }

  protected async deleteDocument(document: StoredDocument): Promise<void> {
    const parentId = this.id();
    const documentId = document.id;
    if (!parentId || !documentId || this.deletingDocumentId()) return;
    if (!window.confirm(`Remove ${document.name}?`)) return;

    this.deletingDocumentId.set(documentId);
    try {
      await this.invoiceDocumentService.deleteInvoiceDocument('saleInvoice', parentId, documentId);
      const invoice = this.saleInvoiceStore.selectedItem();
      if (invoice) {
        const documents = (invoice.documents ?? []).filter((item) => item.id !== documentId);
        this.saleInvoiceStore.setSelectedItem({
          ...invoice,
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

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (
      !this.draft.customerid() ||
      this.draft.dateError() !== null ||
      this.draft.conversionRateError() !== null
    ) {
      return;
    }

    const billing: InvoiceAddress = {
      name: this.draft.billingName(),
      line1: this.draft.billingLine1(),
      ...(this.draft.billingLine2() ? { line2: this.draft.billingLine2() } : {}),
      ...(this.draft.billingCity() ? { city: this.draft.billingCity() } : {}),
      ...(this.draft.billingState() ? { state: this.draft.billingState() } : {}),
      ...(this.draft.billingZip() ? { zip: this.draft.billingZip() } : {}),
      ...(this.draft.billingCountry() ? { country: this.draft.billingCountry() } : {}),
    };

    const shipping: InvoiceAddress = this.draft.useBillingForShipping()
      ? billing
      : {
          name: this.draft.shippingName(),
          line1: this.draft.shippingLine1(),
          ...(this.draft.shippingLine2() ? { line2: this.draft.shippingLine2() } : {}),
          ...(this.draft.shippingCity() ? { city: this.draft.shippingCity() } : {}),
          ...(this.draft.shippingState() ? { state: this.draft.shippingState() } : {}),
          ...(this.draft.shippingZip() ? { zip: this.draft.shippingZip() } : {}),
          ...(this.draft.shippingCountry() ? { country: this.draft.shippingCountry() } : {}),
        };

    const items: SaleInvoiceItemRequest[] = this.draft
      .items()
      .filter((row) => !!row.itemid)
      .map((row, i) => {
        const taxes: SaleInvoiceItemTaxRequest[] = row.taxes.map((t) => ({
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
          quantity: Math.max(1, toNum(this.draft.quantityForRow(row))),
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

    const number = this.draft.number().trim();
    const includeNumber =
      this.mode() === 'edit' ? !!number : !this.draft.autoNumbering() && !!number;

    const payload: SaleInvoicePayload = {
      ...(includeNumber ? { number } : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      discount: toNum(this.draft.discount()),
      subtotal: toNum(this.draft.subtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      currencycode: this.draft.currencycode(),
      billingaddress: billing,
      shippingaddress: shipping,
      description: '',
      customerid: this.draft.customerid(),
      items,
      cprops: {
        autoNumbering: this.mode() === 'edit' ? false : this.draft.autoNumbering(),
        fx: toNum(this.draft.conversionrate()),
        showdiscount: this.draft.showDiscount(),
        showdescription: this.draft.showDescription(),
        taxoption: this.draft.taxoption(),
        deliverystate: this.draft.deliverystate(),
        usebillingforshipping: this.draft.useBillingForShipping(),
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
      await this.invoiceDocumentService.attachInvoiceDocuments('saleInvoice', parentId, files);
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

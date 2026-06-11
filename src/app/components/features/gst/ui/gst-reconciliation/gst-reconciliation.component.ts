import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import {
  TngProgressBarComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { XlsxFileReaderService } from '../../../../../shared/file/xlsx-file-reader.service';
import { PageHeadingComponent } from '../../../../../shared/page-heading/page-heading.component';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationReturnType,
} from '../../data/gst-reconciliation/gst-reconciliation.store';
import { GstImportConfirmDialogComponent } from './gst-import-confirm-dialog/gst-import-confirm-dialog.component';
import { Gstr1ReconciliationComponent } from './gstr1-reconciliation/gstr1-reconciliation.component';
import { Gstr2bReconciliationComponent } from './gstr2b-reconciliation/gstr2b-reconciliation.component';
import {
  type ParsedFilePreview,
  type ParsedInvoice,
} from './gst-reconciliation.types';
import { GST_RECONCILIATION_MONTH_OPTIONS } from './shared/return-base/gst-reconciliation-months.util';
import { GST_RECONCILIATION_STATUS_LEGEND } from './shared/return-panel/gst-reconciliation-status.util';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 15-char GSTIN pattern */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

@Component({
  selector: 'app-gst-reconciliation',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngProgressBarComponent,
    TngIcon,
    TngFileUploadDirective,
    GstImportConfirmDialogComponent,
    Gstr1ReconciliationComponent,
    Gstr2bReconciliationComponent,
  ],
  templateUrl: './gst-reconciliation.component.html',
  styleUrl: './gst-reconciliation.component.css',
})
export class GstReconciliationComponent implements OnDestroy {
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly sessionStore = inject(UserSessionStore);
  private readonly xlsxFileReader = inject(XlsxFileReaderService);
  protected readonly store = inject(GstReconciliationStore);

  // ── File state ────────────────────────────────────────────────────────────
  protected readonly pendingFile    = signal<File | null>(null);
  protected readonly pendingError   = signal<string | null>(null);
  protected readonly sectionHint    = signal<GstReconciliationReturnType | null>(null);
  protected readonly lastImportedSection = signal<GstReconciliationReturnType | null>(null);

  // ── Confirmation dialog ───────────────────────────────────────────────────
  protected readonly confirmDialogOpen = signal(false);
  protected readonly parsedPreview     = signal<ParsedFilePreview | null>(null);
  protected readonly isParsing         = signal(false);

  // ── Drag state ────────────────────────────────────────────────────────────
  protected readonly overviewDragActive = signal(false);
  private overviewDragCounter = 0;

  // ── Static data ───────────────────────────────────────────────────────────
  protected readonly maxFileSize = MAX_FILE_SIZE;
  protected readonly statusLegend = GST_RECONCILIATION_STATUS_LEGEND;

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly context = computed(() => {
    const session  = this.sessionStore.session();
    const branchid = session?.branch?.id ?? null;
    if (!branchid) return null;
    return { branchid, branchName: session?.branch?.name ?? 'Selected branch' };
  });

  protected readonly contextMessage = computed(() => {
    const missing: string[] = [];
    if (!this.sessionStore.session()?.branch?.id) missing.push('branch');
    return missing.length ? `Select ${missing.join(', ')} to load GST reconciliation.` : '';
  });

  protected readonly canImport = computed(() => {
    const permissions = this.permissionsStore.all();
    if (!permissions.length) return true;
    return permissions.some((p) => {
      const n = p.toLowerCase();
      return (
        n === 'gstreconciliation.bulkupload' ||
        n === 'gstreconciliation:bulkupload' ||
        n === 'gstreconciliation:bulk-upload' ||
        (n.includes('gstreconciliation') && n.includes('bulkupload'))
      );
    });
  });

  protected readonly headerContext = computed(() => this.context()?.branchName ?? 'Branch not selected');

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    this.store.clearRefreshResult();

    effect(() => {
      const ctx = this.context();
      if (!ctx) return;
      void this.store.loadSummary();
    });
  }

  ngOnDestroy(): void {
    this.store.clearRefreshResult();
  }

  // ── Import button on each card ────────────────────────────────────────────
  protected triggerImportForSection(returnType: GstReconciliationReturnType): void {
    this.sectionHint.set(returnType);
    (document.getElementById('gst-import-file') as HTMLInputElement | null)?.click();
  }

  // ── TngFileUploadDirective handlers ──────────────────────────────────────
  protected onFilesSelected(event: TngFileUploadSelectedEvent): void {
    const file = event.files[0];
    if (file) void this.receiveFile(file);
    this.resetDrag();
  }

  protected onFilesRejected(event: TngFileUploadRejectedEvent): void {
    const first = event.rejected[0];
    this.pendingError.set(first?.message ?? 'That file is not allowed.');
    this.resetDrag();
  }

  protected onBrowse(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (file) void this.receiveFile(file);
    input.value = '';
  }

  // ── Drag state ────────────────────────────────────────────────────────────
  protected onOverviewDragEnter(): void {
    this.sectionHint.set(null);
    this.overviewDragCounter++;
    this.overviewDragActive.set(true);
  }

  protected onOverviewDragLeave(): void {
    this.overviewDragCounter = Math.max(0, this.overviewDragCounter - 1);
    if (this.overviewDragCounter === 0) this.overviewDragActive.set(false);
  }

  private resetDrag(): void {
    this.overviewDragCounter = 0;
    this.overviewDragActive.set(false);
  }

  // ── Confirmation dialog ───────────────────────────────────────────────────
  protected cancelConfirmation(): void {
    this.confirmDialogOpen.set(false);
    this.parsedPreview.set(null);
    this.pendingFile.set(null);
    this.pendingError.set(null);
    this.sectionHint.set(null);
    this.store.clearRefreshResult();
  }

  // ── Import submission ─────────────────────────────────────────────────────
  protected async submitImportAs(returnType: GstReconciliationReturnType): Promise<void> {
    if (this.store.isBusy()) return;

    const ctx = this.context();
    if (!ctx) { this.pendingError.set(this.contextMessage() || 'Context missing.'); return; }

    const file = this.pendingFile();
    if (!file) { this.pendingError.set('Select a file to import.'); return; }

    if (file.size > MAX_FILE_SIZE) {
      this.pendingError.set('The selected file exceeds the 10 MB limit.');
      return;
    }

    const month = this.uploadMonth();
    if (!month) {
      this.pendingError.set('Could not detect the GST return month from this file.');
      return;
    }

    this.lastImportedSection.set(returnType);
    const success = await this.store.uploadAndRefresh({
      returnType,
      month,
      file,
    });
    if (!success) return;

    this.confirmDialogOpen.set(false);
    this.parsedPreview.set(null);
    this.pendingFile.set(null);
    this.sectionHint.set(null);
    await this.store.loadSummary();
  }

  // ── Private: file routing ─────────────────────────────────────────────────
  private async receiveFile(file: File): Promise<void> {
    this.store.clearRefreshResult();
    this.pendingError.set(null);
    this.pendingFile.set(file);
    this.isParsing.set(true);
    await this.waitForNextPaint();

    try {
      const name = file.name.toLowerCase();
      let preview: ParsedFilePreview | null = null;

      if (name.endsWith('.xlsx')) {
        preview = await this.parseXlsxGstr(file);
      } else if (name.endsWith('.json')) {
        preview = await this.parseJsonGstr(file);
      }

      this.parsedPreview.set(preview);
      if (preview?.detectedReturnType) {
        this.sectionHint.set(preview.detectedReturnType);
      }
    } finally {
      this.isParsing.set(false);
    }

    this.confirmDialogOpen.set(true);
  }

  private waitForNextPaint(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  // ── Private: XLSX → GSTR-2B parser ──────────────────────────────────────
  private async parseXlsxGstr(file: File): Promise<ParsedFilePreview | null> {
    try {
      const rows = await this.xlsxFileReader.readFirstSheetRows(file);

      const title = String(rows[0]?.[0] ?? '').toLowerCase();
      let detectedReturnType: GstReconciliationReturnType | null = null;
      if      (title.includes('gstr-2b') || title.includes('gstr2b')) detectedReturnType = 'gstr2b';
      else if (title.includes('gstr-1')  || title.includes('gstr1'))  detectedReturnType = 'gstr1';

      let dataStart = rows.length;
      for (let i = 0; i < rows.length; i++) {
        if (GSTIN_RE.test(String(rows[i]?.[0] ?? ''))) { dataStart = i; break; }
      }

      const invoices: ParsedInvoice[] = rows
        .slice(dataStart)
        .filter((row) => GSTIN_RE.test(String(row?.[0] ?? '')))
        .map((row) => ({
          gstin:        String(row[0]  ?? ''),
          supplierName: String(row[1]  ?? ''),
          invoiceNo:    String(row[2]  ?? ''),
          invoiceDate:  this.xlsxFileReader.formatCell(row[4]),
          invoiceValue: Number(row[5])  || 0,
          taxableValue: Number(row[8])  || 0,
          igst:         Number(row[9])  || 0,
          cgst:         Number(row[10]) || 0,
          sgst:         Number(row[11]) || 0,
          itcAvailable: String(row[15] ?? '').toLowerCase() === 'yes',
          period:       String(row[13] ?? ''),
        }));

      if (!invoices.length) return null;

      return {
        detectedReturnType,
        period: invoices[0]?.period ?? '',
        invoices,
        totalInvoiceValue: invoices.reduce((s, i) => s + i.invoiceValue, 0),
        totalTaxableValue: invoices.reduce((s, i) => s + i.taxableValue, 0),
        totalIgst:         invoices.reduce((s, i) => s + i.igst,         0),
        totalCgst:         invoices.reduce((s, i) => s + i.cgst,         0),
        totalSgst:         invoices.reduce((s, i) => s + i.sgst,         0),
      };
    } catch {
      return null;
    }
  }

  // ── Private: JSON → GSTR-1 parser ────────────────────────────────────────
  private async parseJsonGstr(file: File): Promise<ParsedFilePreview | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;

      if (!data['gstin'] || !data['fp']) return null;

      const detectedReturnType: GstReconciliationReturnType = 'gstr1';
      const period = this.parseFiscalPeriod(String(data['fp'] ?? ''));
      const gstin  = String(data['gstin'] ?? '');

      const invoices: ParsedInvoice[] = [];

      const expArr = this.asList<Record<string, unknown>>(data['exp']);
      for (const exp of expArr) {
        const rawType = String(exp['exp_typ'] ?? '');
        const label   = rawType === 'WOPAY' ? 'Export (No Tax)'
                      : rawType === 'WPAY'  ? 'Export (With Tax)'
                      : rawType;

        for (const inv of this.asList<Record<string, unknown>>(exp['inv'])) {
          const itms = this.asList<Record<string, unknown>>(inv['itms']);
          invoices.push({
            invoiceNo:    String(inv['inum'] ?? ''),
            invoiceDate:  String(inv['idt']  ?? ''),
            invoiceValue: Number(inv['val'])  || 0,
            taxableValue: itms.reduce((s, i) => s + (Number(i['txval']) || 0), 0),
            igst:         itms.reduce((s, i) => s + (Number(i['iamt'])  || 0), 0),
            cgst:         itms.reduce((s, i) => s + (Number(i['camt'])  || 0), 0),
            sgst:         itms.reduce((s, i) => s + (Number(i['samt'])  || 0), 0),
            taxRate:      Number(itms[0]?.['rt']) || 0,
            exportType:   label,
            period,
          });
        }
      }

      for (const supplier of this.asList<Record<string, unknown>>(data['b2b'])) {
        const ctin = String(supplier['ctin'] ?? '');
        const name = String(supplier['trdnm'] ?? supplier['lgnm'] ?? '');

        for (const inv of this.asList<Record<string, unknown>>(supplier['inv'])) {
          const itms = this.asList<Record<string, unknown>>(inv['itms']);
          const itemDetails = itms.map((item) => item['itm_det'] as Record<string, unknown> | undefined);
          const igst = itemDetails.reduce((s, i) => s + (Number(i?.['iamt'])  || 0), 0);
          const cgst = itemDetails.reduce((s, i) => s + (Number(i?.['camt'])  || 0), 0);
          const sgst = itemDetails.reduce((s, i) => s + (Number(i?.['samt'])  || 0), 0);
          invoices.push({
            gstin:        ctin,
            supplierName: name,
            invoiceNo:    String(inv['inum'] ?? ''),
            invoiceDate:  String(inv['idt']  ?? ''),
            invoiceValue: Number(inv['val'])  || 0,
            taxableValue: itemDetails.reduce((s, i) => s + (Number(i?.['txval']) || 0), 0),
            igst,
            cgst,
            sgst,
            taxRate:      Number(itemDetails[0]?.['rt']) || 0,
            exportType:   this.gstr1InvoiceTypeLabel(String(inv['inv_typ'] ?? ''), { igst, cgst, sgst }),
            period,
          });
        }
      }

      return {
        detectedReturnType,
        period,
        gstin,
        invoices,
        totalInvoiceValue: invoices.reduce((s, i) => s + i.invoiceValue, 0),
        totalTaxableValue: invoices.reduce((s, i) => s + i.taxableValue, 0),
        totalIgst:         invoices.reduce((s, i) => s + i.igst,         0),
        totalCgst:         invoices.reduce((s, i) => s + i.cgst,         0),
        totalSgst:         invoices.reduce((s, i) => s + i.sgst,         0),
      };
    } catch {
      return null;
    }
  }

  private asList<T>(val: unknown): T[] {
    return Array.isArray(val) ? (val as T[]) : [];
  }

  private parseFiscalPeriod(fp: string): string {
    if (fp.length < 6) return fp;
    const month = parseInt(fp.slice(0, 2), 10);
    const year  = fp.slice(4);
    return `${MONTH_LABELS[(month - 1) % 12]}'${year}`;
  }

  private gstr1InvoiceTypeLabel(
    value: string,
    tax?: Readonly<{ igst: number; cgst: number; sgst: number }>,
  ): string {
    const taxLabel = this.gstr1TaxLabel(tax);
    switch (value.trim().toUpperCase()) {
      case 'R': return taxLabel;
      case 'DE': return 'Deemed Export';
      case 'SEWP': return 'SEZ With Tax';
      case 'SEWOP': return 'SEZ No Tax';
      case 'CBW': return 'Custom Bonded Warehouse';
      default: return value;
    }
  }

  private gstr1TaxLabel(tax: Readonly<{ igst: number; cgst: number; sgst: number }> | undefined): string {
    if (!tax) return '';
    const hasStateTax = tax.cgst > 0 || tax.sgst > 0;
    const hasIgst = tax.igst > 0;
    if (hasStateTax && hasIgst) return 'SGST + CGST, IGST';
    if (hasStateTax) return 'SGST + CGST';
    if (hasIgst) return 'IGST';
    return '';
  }

  // ── Private: misc ─────────────────────────────────────────────────────────
  private uploadMonth(): number | null {
    const preview = this.parsedPreview();
    return (
      this.monthFromPeriod(preview?.period) ??
      this.monthFromPeriod(preview?.invoices[0]?.period) ??
      this.monthFromDate(preview?.invoices[0]?.invoiceDate) ??
      null
    );
  }

  private monthFromPeriod(value: string | null | undefined): number | null {
    const period = value?.trim();
    if (!period) return null;

    const numericMonth = period.match(/^(0?[1-9]|1[0-2])(?:\D|$)/)?.[1];
    if (numericMonth) return Number(numericMonth);

    const normalized = period.toLowerCase();
    const match = GST_RECONCILIATION_MONTH_OPTIONS.find((option) => {
      const full = option.label.toLowerCase();
      return normalized.includes(full) || normalized.includes(full.slice(0, 3));
    });
    return match?.value ?? null;
  }

  private monthFromDate(value: string | null | undefined): number | null {
    const date = value?.trim();
    if (!date) return null;

    const isoMonth = date.match(/^\d{4}[-/](0?[1-9]|1[0-2])[-/]\d{1,2}$/)?.[1];
    if (isoMonth) return Number(isoMonth);

    const localMonth = date.match(/^\d{1,2}[-/](0?[1-9]|1[0-2])[-/]\d{2,4}$/)?.[1];
    if (localMonth) return Number(localMonth);

    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) return parsed.getMonth() + 1;

    return null;
  }
}

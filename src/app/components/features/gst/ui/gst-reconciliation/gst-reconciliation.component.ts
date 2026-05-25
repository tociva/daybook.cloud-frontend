import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngProgressBarComponent,
  TngTag,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { XlsxFileReaderService } from '../../../../../shared/file/xlsx-file-reader.service';
import { formatAmountWithCurrency } from '../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../shared/page-heading/page-heading.component';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationDetailRow,
  type GstReconciliationMonthSummary,
  type GstReconciliationReturnType,
  type GstReconciliationStatus,
} from '../../data/gst-reconciliation/gst-reconciliation.store';
import { GstReconciliationService } from '../../data/gst-reconciliation/gst-reconciliation.service';
import { GstImportConfirmDialogComponent } from './gst-import-confirm-dialog/gst-import-confirm-dialog.component';
import {
  RETURN_TYPES,
  type ParsedFilePreview,
  type ParsedInvoice,
  type ReturnTypeMeta,
} from './gst-reconciliation.types';

// ── Domain types ──────────────────────────────────────────────────────────────

type StatusMeta = Readonly<{ icon: string; label: string; status: GstReconciliationStatus }>;
type StatusTagTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

type ReturnTypeSection = Readonly<{
  meta: ReturnTypeMeta;
  months: readonly MonthCell[];
}>;

type MonthCell = GstReconciliationMonthSummary & Readonly<{ label: string; period: string }>;

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'April', value: 4 },    { label: 'May', value: 5 },
  { label: 'June', value: 6 },     { label: 'July', value: 7 },
  { label: 'August', value: 8 },   { label: 'September', value: 9 },
  { label: 'October', value: 10 }, { label: 'November', value: 11 },
  { label: 'December', value: 12 },{ label: 'January', value: 1 },
  { label: 'February', value: 2 }, { label: 'March', value: 3 },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMPTY_MONTH = {
  booksInvoiceCount: 0, differenceAmount: 0, gstInvoiceCount: 0,
  matchedCount: 0, mismatchCount: 0, partialCount: 0,
} as const;

/** 15-char GSTIN pattern */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

@Component({
  selector: 'app-gst-reconciliation',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngProgressBarComponent,
    TngTag,
    TngIcon,
    TngFileUploadDirective,
    GstImportConfirmDialogComponent,
  ],
  templateUrl: './gst-reconciliation.component.html',
  styleUrl: './gst-reconciliation.component.css',
})
export class GstReconciliationComponent {
  private readonly router = inject(Router);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly sessionStore = inject(UserSessionStore);
  private readonly xlsxFileReader = inject(XlsxFileReaderService);
  private readonly reconciliationService = inject(GstReconciliationService);
  protected readonly store = inject(GstReconciliationStore);

  // ── Per-cell refresh state ────────────────────────────────────────────────
  /** Tracks which cell is currently being refreshed, e.g. 'gstr1-4'. */
  protected readonly refreshingCell = signal<string | null>(null);

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
  private readonly loadingDifferenceKeys = new Set<string>();

  // ── Static data ───────────────────────────────────────────────────────────
  protected readonly maxFileSize = MAX_FILE_SIZE;
  protected readonly returnTypes = RETURN_TYPES;
  protected readonly monthDifferenceAmounts = signal<Readonly<Record<string, number>>>({});

  protected readonly statusLegend: readonly StatusMeta[] = [
    { status: 'matched',      label: 'Matched',       icon: 'circleCheck'  },
    { status: 'partialMatch', label: 'Partial match', icon: 'circleAlert'  },
    { status: 'noMatch',      label: 'No match',      icon: 'circleX'      },
    { status: 'inProgress',   label: 'In progress',   icon: 'loaderCircle' },
    { status: 'pending',      label: 'Pending',       icon: 'circleDashed' },
    { status: 'upcoming',     label: 'Upcoming',      icon: 'clock'        },
  ];

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

  protected readonly gstr1Months  = computed(() => this.buildMonthCells('gstr1'));
  protected readonly gstr2bMonths = computed(() => this.buildMonthCells('gstr2b'));

  protected readonly returnTypeSections = computed<readonly ReturnTypeSection[]>(() =>
    this.returnTypes.map((meta) => ({
      meta,
      months: meta.value === 'gstr1' ? this.gstr1Months() : this.gstr2bMonths(),
    })),
  );

  protected readonly headerContext = computed(() => this.context()?.branchName ?? 'Branch not selected');

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    effect(() => {
      const ctx = this.context();
      if (!ctx) return;
      void this.store.loadSummary();
    });

    effect(() => {
      const summary = this.store.summary();
      if (!summary) return;
      void this.hydrateMonthDifferences([...summary.gstr1, ...summary.gstr2b]);
    });
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
    this.monthDifferenceAmounts.set({});
    await this.store.loadSummary();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  protected openMonth(cell: MonthCell): void {
    const ctx = this.context();
    if (!ctx) return;
    void this.router.navigate(
      ['/app/trading/gst-reconciliation/detail', cell.returnType, cell.month],
      { queryParams: { burl: this.router.url } },
    );
  }

  // ── Per-cell refresh ──────────────────────────────────────────────────────
  protected cellKey(cell: MonthCell): string {
    return `${cell.returnType}-${cell.month}`;
  }

  protected isRefreshingCell(cell: MonthCell): boolean {
    return this.refreshingCell() === this.cellKey(cell);
  }

  protected async refreshMonth(event: Event, cell: MonthCell): Promise<void> {
    event.stopPropagation();
    if (this.store.isBusy() || this.refreshingCell()) return;

    const key = this.cellKey(cell);
    this.refreshingCell.set(key);
    this.store.clearRefreshResult();
    this.monthDifferenceAmounts.update((current) => {
      const { [key]: _removed, ...remaining } = current;
      return remaining;
    });

    try {
      await this.store.refresh({ returnType: cell.returnType, month: cell.month });
      await this.store.loadSummary();
    } finally {
      this.refreshingCell.set(null);
    }
  }

  // ── Status helpers ────────────────────────────────────────────────────────
  protected statusLabel(status: GstReconciliationStatus): string {
    return this.statusLegend.find((e) => e.status === status)?.label ?? status;
  }
  protected statusIcon(status: GstReconciliationStatus): string {
    return this.statusLegend.find((e) => e.status === status)?.icon ?? 'circle';
  }
  protected statusTone(status: GstReconciliationStatus): StatusTagTone {
    switch (status) {
      case 'matched':
        return 'success';
      case 'partialMatch':
        return 'warning';
      case 'noMatch':
        return 'danger';
      case 'inProgress':
        return 'info';
      case 'pending':
      case 'upcoming':
        return 'neutral';
    }
  }
  protected totalByStatus(months: readonly MonthCell[], status: GstReconciliationStatus): number {
    return months.filter((m) => m.status === status).length;
  }

  // ── Formatting ────────────────────────────────────────────────────────────
  protected formatAmount(value: number | null | undefined): string {
    return formatAmountWithCurrency(value ?? 0, this.currencyCode());
  }

  protected monthDifferenceAmount(cell: MonthCell): number {
    return this.monthDifferenceAmounts()[this.monthDifferenceKey(cell)] ?? cell.differenceAmount ?? 0;
  }

  protected hasMonthDifference(cell: MonthCell): boolean {
    return this.monthDifferenceAmount(cell) !== 0;
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
          invoices.push({
            gstin:        ctin,
            supplierName: name,
            invoiceNo:    String(inv['inum'] ?? ''),
            invoiceDate:  String(inv['idt']  ?? ''),
            invoiceValue: Number(inv['val'])  || 0,
            taxableValue: itms.reduce((s, i) => s + (Number((i['itm_det'] as Record<string, unknown>)?.['txval']) || 0), 0),
            igst:         itms.reduce((s, i) => s + (Number((i['itm_det'] as Record<string, unknown>)?.['iamt'])  || 0), 0),
            cgst:         itms.reduce((s, i) => s + (Number((i['itm_det'] as Record<string, unknown>)?.['camt'])  || 0), 0),
            sgst:         itms.reduce((s, i) => s + (Number((i['itm_det'] as Record<string, unknown>)?.['samt'])  || 0), 0),
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
    const match = MONTH_OPTIONS.find((option) => {
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

  private buildMonthCells(returnType: GstReconciliationReturnType): readonly MonthCell[] {
    const summary   = this.store.summary();
    const months    = summary?.[returnType] ?? [];
    const startYear = this.fiscalYearStartYear();

    return MONTH_OPTIONS.map((option) => {
      const existing = months.find((m) => m.month === option.value);
      const year     = option.value >= 4 ? startYear : startYear + 1;
      return {
        ...EMPTY_MONTH, ...existing,
        returnType,
        month:  option.value,
        status: existing?.status ?? this.missingMonthStatus(option.value),
        label:  option.label.slice(0, 3),
        period: `${option.label.slice(0, 3)} ${year}`,
      };
    });
  }

  private async hydrateMonthDifferences(
    months: readonly GstReconciliationMonthSummary[],
  ): Promise<void> {
    const cached = this.monthDifferenceAmounts();
    const candidates = months.filter(
      (month) =>
        month.status !== 'upcoming' &&
        (month.booksInvoiceCount > 0 || month.gstInvoiceCount > 0) &&
        cached[this.monthDifferenceKey(month)] === undefined &&
        !this.loadingDifferenceKeys.has(this.monthDifferenceKey(month)),
    );

    await Promise.all(
      candidates.map(async (month) => {
        const key = this.monthDifferenceKey(month);
        this.loadingDifferenceKeys.add(key);
        try {
          const detail = await this.reconciliationService.loadDetail(month.returnType, month.month);
          const differenceAmount = detail.groups.reduce(
            (total, group) =>
              total +
              group.rows.reduce((groupTotal, row) => groupTotal + this.rowDifferenceAmount(row), 0),
            0,
          );
          this.monthDifferenceAmounts.update((current) => ({ ...current, [key]: differenceAmount }));
        } catch {
          this.monthDifferenceAmounts.update((current) => ({
            ...current,
            [key]: month.differenceAmount ?? 0,
          }));
        } finally {
          this.loadingDifferenceKeys.delete(key);
        }
      }),
    );
  }

  private monthDifferenceKey(cell: Pick<MonthCell, 'month' | 'returnType'>): string {
    return `${cell.returnType}-${cell.month}`;
  }

  private rowDifferenceAmount(row: GstReconciliationDetailRow): number {
    return Math.abs(
      (row.booksInvoice?.invoiceValue ?? 0) - (row.gstInvoice?.invoiceValue ?? 0),
    );
  }

  private missingMonthStatus(month: number): GstReconciliationStatus {
    const fy = this.sessionStore.session()?.fiscalyear;
    if (!fy?.startdate) return 'pending';
    const startYear = this.fiscalYearStartYear();
    return new Date(month >= 4 ? startYear : startYear + 1, month - 1, 1) > new Date()
      ? 'upcoming' : 'pending';
  }

  private fiscalYearStartYear(): number {
    const fy = this.sessionStore.session()?.fiscalyear;
    const fromDate = fy?.startdate ? new Date(fy.startdate).getFullYear() : NaN;
    if (Number.isFinite(fromDate)) return fromDate;
    const fromName = fy?.name?.match(/\d{4}/)?.[0];
    return fromName ? Number(fromName) : new Date().getFullYear();
  }

  private currencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.fiscalyear?.currencycode ??
      this.sessionStore.session()?.branch?.currencycode
    );
  }
}

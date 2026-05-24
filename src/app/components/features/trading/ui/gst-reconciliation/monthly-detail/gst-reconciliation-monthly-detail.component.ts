import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TngButtonComponent, TngCardComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationDetailRow,
  type GstReconciliationInvoice,
  type GstReconciliationReturnType,
  type GstReconciliationStatus,
} from '../../../data/inventory/gst-reconciliation';

type StatusMeta = Readonly<{
  icon: string;
  label: string;
  status: GstReconciliationStatus;
}>;

const MONTH_NAMES: Readonly<Record<number, string>> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

@Component({
  selector: 'app-gst-reconciliation-monthly-detail',
  standalone: true,
  imports: [PageHeadingComponent, TngButtonComponent, TngCardComponent, TngIcon],
  templateUrl: './gst-reconciliation-monthly-detail.component.html',
  styleUrl: './gst-reconciliation-monthly-detail.component.css',
})
export class GstReconciliationMonthlyDetailComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(UserSessionStore);
  protected readonly store = inject(GstReconciliationStore);

  protected readonly statusLegend: readonly StatusMeta[] = [
    { status: 'matched', label: 'Matched', icon: 'circleCheck' },
    { status: 'partial', label: 'Partial', icon: 'circleAlert' },
    { status: 'notMatched', label: 'Not matched', icon: 'circleX' },
    { status: 'pending', label: 'Pending', icon: 'circleDashed' },
    { status: 'upcoming', label: 'Upcoming', icon: 'clock' },
  ];

  protected readonly returnType = computed<GstReconciliationReturnType>(() => {
    const value = this.route.snapshot.paramMap.get('returnType');
    return value === 'gstr2b' ? 'gstr2b' : 'gstr1';
  });

  protected readonly month = computed(() => Number(this.route.snapshot.paramMap.get('month') ?? 4));

  protected readonly title = computed(
    () => `${this.returnTypeLabel(this.returnType())} · ${MONTH_NAMES[this.month()] ?? 'Month'}`,
  );

  protected readonly contextMessage = computed(() => {
    const session = this.sessionStore.session();
    const missing: string[] = [];
    if (!session?.branch?.id) missing.push('branch');

    return missing.length ? `Select ${missing.join(', ')} to load GST reconciliation.` : '';
  });

  protected readonly description = computed(() => {
    return this.contextMessage() || 'Monthly reconciliation grouped by party.';
  });

  constructor() {
    void this.loadDetail();
  }

  protected async back(): Promise<void> {
    const backUrl = this.route.snapshot.queryParamMap.get('burl');
    await this.router.navigateByUrl(backUrl || '/app/trading/gst-reconciliation');
  }

  protected status(row: GstReconciliationDetailRow): GstReconciliationStatus {
    return row.status ?? row.reconciliationStatus ?? row.computedStatus ?? 'pending';
  }

  protected statusLabel(status: GstReconciliationStatus): string {
    return this.statusLegend.find((entry) => entry.status === status)?.label ?? status;
  }

  protected statusIcon(status: GstReconciliationStatus): string {
    return this.statusLegend.find((entry) => entry.status === status)?.icon ?? 'circle';
  }

  protected formatDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(value: number | null | undefined): string {
    return formatAmountWithCurrency(value ?? 0, this.currencyCode());
  }

  protected invoiceNumber(invoice: GstReconciliationInvoice | null | undefined): string {
    return invoice?.invoiceNumber?.trim() || '-';
  }

  protected invoiceTotal(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.invoiceValue);
  }

  protected invoiceTax(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.totalTax);
  }

  protected invoiceTaxable(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.taxableValue);
  }

  protected hasDifference(row: GstReconciliationDetailRow): boolean {
    return (row.differenceAmount ?? 0) !== 0;
  }

  protected rowParty(row: GstReconciliationDetailRow): string {
    return row.partyName || row.partyGstin || '-';
  }

  private async loadDetail(): Promise<void> {
    const session = this.sessionStore.session();
    const branchid = session?.branch?.id;

    if (!branchid) return;

    await this.store.loadDetail(this.returnType(), this.month(), {
      branchid,
    });
  }

  private returnTypeLabel(returnType: GstReconciliationReturnType): string {
    return returnType === 'gstr1' ? 'GSTR-1' : 'GSTR-2B';
  }

  private currencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.fiscalyear?.currencycode ??
      this.sessionStore.session()?.branch?.currencycode
    );
  }
}

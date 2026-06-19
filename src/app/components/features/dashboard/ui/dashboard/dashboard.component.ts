import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngProgressSpinnerComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { PageHeadingComponent } from '../../../../../shared/page-heading/page-heading.component';
import { formatAmountWithCurrency } from '../../../../../shared/format/currency';
import { hasAccountingReportPermission } from '../../../accounting/shared/accounting-report-permissions';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type {
  AccountantDashboardActionKey,
  AccountantDashboardComplianceMetric,
} from '../../data';
import {
  AccountantDashboardStore,
  resolveAccountantDashboardNavigationTarget,
} from '../../data';

type DashboardStatusRow = Readonly<{
  actionKey: AccountantDashboardActionKey;
  actionLabel: string;
  area: string;
  count: number;
  detail: string;
  oldestDate: string | null;
  title: string;
}>;

@Component({
  selector: 'app-dashboard',
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngIcon,
    TngProgressSpinnerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly router = inject(Router);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly dashboardStore = inject(AccountantDashboardStore);

  private loadedContextKey: string | null = null;

  protected readonly session = computed(() => this.userSessionStore.session());
  protected readonly canViewDashboard = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'accountantDashboard'),
  );
  protected readonly contextKey = computed(() => {
    const session = this.session();
    const branchId = session?.branch?.id;
    const fiscalYearId = session?.fiscalyear?.id;

    return branchId && fiscalYearId ? `${branchId}:${fiscalYearId}` : null;
  });
  protected readonly missingContextMessage = computed(() => {
    const session = this.session();
    const missing: string[] = [];
    if (!session?.organization?.id) missing.push('organization');
    if (!session?.branch?.id) missing.push('branch');
    if (!session?.fiscalyear?.id) missing.push('fiscal year');

    return missing.length
      ? `Select ${missing.join(', ')} to load the accountant dashboard.`
      : null;
  });
  protected readonly headerDescription = computed(() => {
    const session = this.session();
    const branchName = session?.branch?.name ?? 'Branch not selected';
    const fiscalYearName = session?.fiscalyear?.name ?? 'Fiscal year not selected';

    return `${branchName} · ${fiscalYearName}`;
  });
  protected readonly summary = computed(() =>
    this.canViewDashboard() && !this.missingContextMessage()
      ? this.dashboardStore.summary()
      : null,
  );
  protected readonly statusRows = computed<readonly DashboardStatusRow[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    const gstr1Pending = this.pendingComplianceMonths(summary.compliance.gstr1);
    const gstr2bPending = this.pendingComplianceMonths(summary.compliance.gstr2b);
    const bankTransactions = summary.pendingReconciliation.bankTransactions;

    const rows: ReadonlyArray<DashboardStatusRow | null> = [
      gstr1Pending > 0
        ? {
            actionKey: summary.compliance.gstr1.actionKey,
            actionLabel: 'View GSTR-1 GST compliance',
            area: 'GST compliance',
            count: gstr1Pending,
            detail: `${summary.compliance.gstr1.partialMonths} partial / ${summary.compliance.gstr1.notStartedMonths} not started`,
            oldestDate: null,
            title: 'GSTR-1',
          }
        : null,
      gstr2bPending > 0
        ? {
            actionKey: summary.compliance.gstr2b.actionKey,
            actionLabel: 'View GSTR-2B GST compliance',
            area: 'GST compliance',
            count: gstr2bPending,
            detail: `${summary.compliance.gstr2b.partialMonths} partial / ${summary.compliance.gstr2b.notStartedMonths} not started`,
            oldestDate: null,
            title: 'GSTR-2B',
          }
        : null,
      summary.pendingAllocations.receipts.count > 0
        ? {
            actionKey: summary.pendingAllocations.receipts.actionKey,
            actionLabel: 'View Receipts pending allocations',
            area: 'Pending allocations',
            count: summary.pendingAllocations.receipts.count,
            detail: this.formatAmount(summary.pendingAllocations.receipts.amount),
            oldestDate: summary.pendingAllocations.receipts.oldestDate,
            title: 'Receipts',
          }
        : null,
      summary.pendingAllocations.payments.count > 0
        ? {
            actionKey: summary.pendingAllocations.payments.actionKey,
            actionLabel: 'View Payments pending allocations',
            area: 'Pending allocations',
            count: summary.pendingAllocations.payments.count,
            detail: this.formatAmount(summary.pendingAllocations.payments.amount),
            oldestDate: summary.pendingAllocations.payments.oldestDate,
            title: 'Payments',
          }
        : null,
      summary.pendingJournals.saleInvoices.count > 0
        ? {
            actionKey: summary.pendingJournals.saleInvoices.actionKey,
            actionLabel: 'View Sale invoices pending journals',
            area: 'Pending journals',
            count: summary.pendingJournals.saleInvoices.count,
            detail: this.formatAmount(summary.pendingJournals.saleInvoices.amount),
            oldestDate: summary.pendingJournals.saleInvoices.oldestDate,
            title: 'Sale invoices',
          }
        : null,
      summary.pendingJournals.purchaseInvoices.count > 0
        ? {
            actionKey: summary.pendingJournals.purchaseInvoices.actionKey,
            actionLabel: 'View Purchase invoices pending journals',
            area: 'Pending journals',
            count: summary.pendingJournals.purchaseInvoices.count,
            detail: this.formatAmount(summary.pendingJournals.purchaseInvoices.amount),
            oldestDate: summary.pendingJournals.purchaseInvoices.oldestDate,
            title: 'Purchase invoices',
          }
        : null,
      summary.pendingJournals.receipts.count > 0
        ? {
            actionKey: summary.pendingJournals.receipts.actionKey,
            actionLabel: 'View Receipts pending journals',
            area: 'Pending journals',
            count: summary.pendingJournals.receipts.count,
            detail: this.formatAmount(summary.pendingJournals.receipts.amount),
            oldestDate: summary.pendingJournals.receipts.oldestDate,
            title: 'Receipts',
          }
        : null,
      summary.pendingJournals.payments.count > 0
        ? {
            actionKey: summary.pendingJournals.payments.actionKey,
            actionLabel: 'View Payments pending journals',
            area: 'Pending journals',
            count: summary.pendingJournals.payments.count,
            detail: this.formatAmount(summary.pendingJournals.payments.amount),
            oldestDate: summary.pendingJournals.payments.oldestDate,
            title: 'Payments',
          }
        : null,
      bankTransactions.count > 0
        ? {
            actionKey: bankTransactions.actionKey,
            actionLabel: 'View Bank transactions pending reconciliation',
            area: 'Bank reconciliation',
            count: bankTransactions.count,
            detail: `Debit ${this.formatAmount(bankTransactions.debitAmount)} / Credit ${this.formatAmount(bankTransactions.creditAmount)}`,
            oldestDate: bankTransactions.oldestDate,
            title: 'Bank transactions',
          }
        : null,
    ];

    return rows.filter((row): row is DashboardStatusRow => row !== null);
  });

  protected readonly hasPendingTasks = computed(() => this.statusRows().length > 0);

  constructor() {
    effect(() => {
      const contextKey = this.contextKey();
      if (!contextKey || !this.canViewDashboard()) {
        return;
      }

      if (this.loadedContextKey === contextKey) {
        return;
      }

      this.loadedContextKey = contextKey;
      void this.dashboardStore.loadSummary();
    });
  }

  protected async retry(): Promise<void> {
    const contextKey = this.contextKey();
    if (!contextKey || !this.canViewDashboard()) return;

    this.loadedContextKey = contextKey;
    await this.dashboardStore.loadSummary();
  }

  protected openAction(actionKey: AccountantDashboardActionKey): void {
    const target = resolveAccountantDashboardNavigationTarget(actionKey);
    void this.router.navigate([target.route], {
      queryParams: target.queryParams,
    });
  }

  protected formatAmount(value: number): string {
    const fiscalYear = this.session()?.fiscalyear;
    const branch = this.session()?.branch;
    const currencyCode = fiscalYear?.currencycode ?? branch?.currencycode ?? 'INR';

    return formatAmountWithCurrency(value, currencyCode, fiscalYear?.currency ?? null);
  }

  protected formatDate(value: string | null): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatMonth(value: string | null | undefined): string {
    const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
    if (!match) return value ?? '—';

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return value ?? '—';

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      year: 'numeric',
    }).format(new Date(Date.UTC(year, monthIndex, 1)));
  }

  protected formatLoadedAt(value: string | null): string {
    return this.dateManagement.formatDisplayDateTime(value, '—');
  }

  private pendingComplianceMonths(metric: AccountantDashboardComplianceMetric): number {
    return metric.partialMonths + metric.notStartedMonths;
  }
}

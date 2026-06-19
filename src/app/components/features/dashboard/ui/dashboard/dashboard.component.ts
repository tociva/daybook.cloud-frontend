import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
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
  AccountantDashboardAmountMetric,
  AccountantDashboardBankReconciliationMetric,
  AccountantDashboardComplianceMetric,
} from '../../data';
import {
  AccountantDashboardStore,
  resolveAccountantDashboardNavigationTarget,
} from '../../data';

type DashboardMetricCard = Readonly<{
  actionKey: AccountantDashboardActionKey;
  amount: number;
  count: number;
  description: string;
  icon: string;
  metric: AccountantDashboardAmountMetric;
  title: string;
}>;

type DashboardComplianceCard = Readonly<{
  actionKey: AccountantDashboardActionKey;
  icon: string;
  metric: AccountantDashboardComplianceMetric;
  title: string;
}>;

type DashboardBankCard = Readonly<{
  actionKey: AccountantDashboardActionKey;
  icon: string;
  metric: AccountantDashboardBankReconciliationMetric;
  title: string;
}>;

@Component({
  selector: 'app-dashboard',
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
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
  protected readonly complianceCards = computed<readonly DashboardComplianceCard[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return [
      {
        actionKey: summary.compliance.gstr1.actionKey,
        icon: 'file-check-2',
        metric: summary.compliance.gstr1,
        title: 'GSTR-1',
      },
      {
        actionKey: summary.compliance.gstr2b.actionKey,
        icon: 'file-search',
        metric: summary.compliance.gstr2b,
        title: 'GSTR-2B',
      },
    ];
  });
  protected readonly pendingAllocationCards = computed<readonly DashboardMetricCard[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return [
      {
        actionKey: summary.pendingAllocations.receipts.actionKey,
        amount: summary.pendingAllocations.receipts.amount,
        count: summary.pendingAllocations.receipts.count,
        description: 'Unallocated receipt balance',
        icon: 'receipt',
        metric: summary.pendingAllocations.receipts,
        title: 'Receipts',
      },
      {
        actionKey: summary.pendingAllocations.payments.actionKey,
        amount: summary.pendingAllocations.payments.amount,
        count: summary.pendingAllocations.payments.count,
        description: 'Unallocated payment balance',
        icon: 'wallet-cards',
        metric: summary.pendingAllocations.payments,
        title: 'Payments',
      },
    ];
  });
  protected readonly pendingJournalCards = computed<readonly DashboardMetricCard[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return [
      {
        actionKey: summary.pendingJournals.saleInvoices.actionKey,
        amount: summary.pendingJournals.saleInvoices.amount,
        count: summary.pendingJournals.saleInvoices.count,
        description: 'Sale invoices without journals',
        icon: 'file-text',
        metric: summary.pendingJournals.saleInvoices,
        title: 'Sale invoices',
      },
      {
        actionKey: summary.pendingJournals.purchaseInvoices.actionKey,
        amount: summary.pendingJournals.purchaseInvoices.amount,
        count: summary.pendingJournals.purchaseInvoices.count,
        description: 'Purchase invoices without journals',
        icon: 'file-input',
        metric: summary.pendingJournals.purchaseInvoices,
        title: 'Purchase invoices',
      },
      {
        actionKey: summary.pendingJournals.receipts.actionKey,
        amount: summary.pendingJournals.receipts.amount,
        count: summary.pendingJournals.receipts.count,
        description: 'Receipts without journals',
        icon: 'receipt-text',
        metric: summary.pendingJournals.receipts,
        title: 'Receipts',
      },
      {
        actionKey: summary.pendingJournals.payments.actionKey,
        amount: summary.pendingJournals.payments.amount,
        count: summary.pendingJournals.payments.count,
        description: 'Payments without journals',
        icon: 'wallet',
        metric: summary.pendingJournals.payments,
        title: 'Payments',
      },
    ];
  });
  protected readonly bankReconciliationCard = computed<DashboardBankCard | null>(() => {
    const metric = this.summary()?.pendingReconciliation.bankTransactions;
    if (!metric) return null;

    return {
      actionKey: metric.actionKey,
      icon: 'landmark',
      metric,
      title: 'Bank transactions',
    };
  });

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

  protected totalComplianceMonths(metric: AccountantDashboardComplianceMetric): number {
    return metric.greenMonths + metric.partialMonths + metric.notStartedMonths;
  }

  protected needsComplianceWork(metric: AccountantDashboardComplianceMetric): boolean {
    return metric.partialMonths + metric.notStartedMonths > 0;
  }
}


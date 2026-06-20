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
import { hasAccountingReportPermission } from '../../../accounting/shared/accounting-report-permissions';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type {
  AccountantDashboardActionKey,
  AccountantDashboardMetric,
  AccountantDashboardSummaryQuery,
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
  title: string;
}>;

type DashboardStatusRowOptions = Readonly<{
  actionLabel: string;
  area: string;
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
  protected readonly summaryQuery = computed<AccountantDashboardSummaryQuery | null>(() => {
    const session = this.session();
    const branchid = session?.branch?.id;
    const fiscalyearid = session?.fiscalyear?.id;

    return branchid && fiscalyearid ? { branchid, fiscalyearid } : null;
  });
  protected readonly contextKey = computed(() => {
    const query = this.summaryQuery();

    return query ? `${query.branchid}:${query.fiscalyearid}` : null;
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

    const rows: ReadonlyArray<DashboardStatusRow | null> = [
      this.statusRow(summary.compliance.gstr1, {
        actionLabel: 'View GSTR-1 GST compliance',
        area: 'GST compliance',
        title: 'GSTR-1',
      }),
      this.statusRow(summary.compliance.gstr2b, {
        actionLabel: 'View GSTR-2B GST compliance',
        area: 'GST compliance',
        title: 'GSTR-2B',
      }),
      this.statusRow(summary.pendingAllocations.receipts, {
        actionLabel: 'View Receipts pending allocations',
        area: 'Pending allocations',
        title: 'Receipts',
      }),
      this.statusRow(summary.pendingAllocations.payments, {
        actionLabel: 'View Payments pending allocations',
        area: 'Pending allocations',
        title: 'Payments',
      }),
      this.statusRow(summary.pendingJournals.saleInvoices, {
        actionLabel: 'View Sale invoices pending journals',
        area: 'Pending journals',
        title: 'Sale invoices',
      }),
      this.statusRow(summary.pendingJournals.purchaseInvoices, {
        actionLabel: 'View Purchase invoices pending journals',
        area: 'Pending journals',
        title: 'Purchase invoices',
      }),
      this.statusRow(summary.pendingJournals.receipts, {
        actionLabel: 'View Receipts pending journals',
        area: 'Pending journals',
        title: 'Receipts',
      }),
      this.statusRow(summary.pendingJournals.payments, {
        actionLabel: 'View Payments pending journals',
        area: 'Pending journals',
        title: 'Payments',
      }),
      this.statusRow(summary.pendingReconciliation.bankTransactions, {
        actionLabel: 'View Bank transactions pending reconciliation',
        area: 'Bank reconciliation',
        title: 'Bank transactions',
      }),
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
      void this.dashboardStore.loadSummary(this.summaryQuery() ?? undefined);
    });
  }

  protected async retry(): Promise<void> {
    const contextKey = this.contextKey();
    if (!contextKey || !this.canViewDashboard()) return;

    this.loadedContextKey = contextKey;
    await this.dashboardStore.loadSummary(this.summaryQuery() ?? undefined);
  }

  protected openAction(actionKey: AccountantDashboardActionKey): void {
    const target = resolveAccountantDashboardNavigationTarget(actionKey);
    void this.router.navigate([target.route], {
      queryParams: target.queryParams,
    });
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

  private statusRow(
    metric: AccountantDashboardMetric,
    options: DashboardStatusRowOptions,
  ): DashboardStatusRow | null {
    if (metric.pendingCount <= 0) return null;

    return {
      actionKey: metric.actionKey,
      actionLabel: options.actionLabel,
      area: options.area,
      count: metric.pendingCount,
      detail: `${metric.pendingCount} / ${metric.totalCount} pending`,
      title: options.title,
    };
  }
}

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { AccountantDashboardSummary } from '../../data';
import { AccountantDashboardStore } from '../../data';
import { DashboardComponent } from './dashboard.component';

const fullSession: UserSession = {
  name: 'Test User',
  email: 'test@example.com',
  userid: 'user-1',
  organization: {
    id: 'org-1',
    name: 'Acme Books',
    email: 'accounts@example.com',
    userid: 'user-1',
    branches: [],
  },
  branch: {
    id: 'branch-1',
    name: 'Bengaluru',
    email: 'branch@example.com',
    organizationid: 'org-1',
    organization: {
      id: 'org-1',
      name: 'Acme Books',
      email: 'accounts@example.com',
      userid: 'user-1',
      branches: [],
    },
    countrycode: 'IN',
    currencycode: 'INR',
    dateformat: 'DD/MM/YYYY',
    fiscalstart: '04-01',
    fiscalyears: [],
    invnumber: 'INV',
    recnumber: 'REC',
    timezone: 'Asia/Kolkata',
    userid: 'user-1',
  },
  fiscalyear: {
    id: 'fy-1',
    branchid: 'branch-1',
    currencycode: 'INR',
    enddate: '2027-03-31',
    jnumber: 'JV',
    name: 'FY 2026-27',
    startdate: '2026-04-01',
  },
  member: null,
  memberorgs: [],
};

const summary: AccountantDashboardSummary = {
  asOfDate: '2026-06-19',
  branchid: 'branch-1',
  fiscalyearid: 'fy-1',
  lastCompletedMonth: '2026-05',
  compliance: {
    gstr1: {
      actionKey: 'gst.gstr1',
      pendingCount: 1,
      totalCount: 3,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      pendingCount: 0,
      totalCount: 3,
    },
  },
  pendingAllocations: {
    payments: {
      actionKey: 'payments.pendingAllocation',
      pendingCount: 0,
      totalCount: 2,
    },
    receipts: {
      actionKey: 'receipts.pendingAllocation',
      pendingCount: 2,
      totalCount: 3,
    },
  },
  pendingJournals: {
    payments: {
      actionKey: 'payments.pendingJournal',
      pendingCount: 0,
      totalCount: 1,
    },
    purchaseInvoices: {
      actionKey: 'purchaseInvoices.pendingJournal',
      pendingCount: 1,
      totalCount: 2,
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      pendingCount: 1,
      totalCount: 2,
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      pendingCount: 4,
      totalCount: 5,
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      pendingCount: 0,
      totalCount: 4,
    },
  },
};

const noPendingSummary: AccountantDashboardSummary = {
  ...summary,
  compliance: {
    gstr1: {
      ...summary.compliance.gstr1,
      pendingCount: 0,
    },
    gstr2b: {
      ...summary.compliance.gstr2b,
      pendingCount: 0,
    },
  },
  pendingAllocations: {
    payments: {
      ...summary.pendingAllocations.payments,
      pendingCount: 0,
    },
    receipts: {
      ...summary.pendingAllocations.receipts,
      pendingCount: 0,
    },
  },
  pendingJournals: {
    payments: {
      ...summary.pendingJournals.payments,
      pendingCount: 0,
    },
    purchaseInvoices: {
      ...summary.pendingJournals.purchaseInvoices,
      pendingCount: 0,
    },
    receipts: {
      ...summary.pendingJournals.receipts,
      pendingCount: 0,
    },
    saleInvoices: {
      ...summary.pendingJournals.saleInvoices,
      pendingCount: 0,
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      ...summary.pendingReconciliation.bankTransactions,
      pendingCount: 0,
    },
  },
};

type SetupOptions = Readonly<{
  error?: string | null;
  isLoading?: boolean;
  permissions?: readonly string[];
  session?: UserSession | null;
  summary?: AccountantDashboardSummary | null;
}>;

function setup(options: SetupOptions = {}): {
  fixture: ComponentFixture<DashboardComponent>;
  loadSummary: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
} {
  const dashboardSummary = signal<AccountantDashboardSummary | null>(options.summary ?? null);
  const error = signal<string | null>(options.error ?? null);
  const isLoading = signal(options.isLoading ?? false);
  const loadedAt = signal<string | null>(options.summary ? '2026-06-19T10:00:00.000Z' : null);
  const loadSummary = vi.fn(async () => undefined);
  const navigate = vi.fn();

  TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [
      {
        provide: AccountantDashboardStore,
        useValue: {
          clearError: vi.fn(),
          error,
          isLoading,
          loadedAt,
          loadSummary,
          summary: dashboardSummary,
        },
      },
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn((value: string | null | undefined, fallback = '-') =>
            value ? `date:${value}` : fallback,
          ),
          formatDisplayDateTime: vi.fn((value: string | null | undefined, fallback = '-') =>
            value ? `datetime:${value}` : fallback,
          ),
        },
      },
      {
        provide: PermissionsStore,
        useValue: {
          all: signal(options.permissions ?? ['accountingReports.accountantDashboard']),
        },
      },
      {
        provide: Router,
        useValue: {
          navigate,
        },
      },
      {
        provide: UserSessionStore,
        useValue: {
          session: signal(options.session === undefined ? fullSession : options.session),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();

  return { fixture, loadSummary, navigate };
}

describe('DashboardComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('shows a missing-context notice and does not load without branch and fiscal year', () => {
    const { fixture, loadSummary } = setup({
      session: {
        ...fullSession,
        branch: null,
        fiscalyear: null,
      },
    });

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Select branch, fiscal year to load the accountant dashboard.');
    expect(loadSummary).not.toHaveBeenCalled();
  });

  it('renders a single compact pending tasks table from a loaded summary', () => {
    const { fixture, loadSummary } = setup({ summary });
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(loadSummary).toHaveBeenCalledWith({ branchid: 'branch-1', fiscalyearid: 'fy-1' });
    expect(text).toContain('Pending Tasks');
    expect(text).toContain('Area');
    expect(text).toContain('Item');
    expect(text).toContain('Count');
    expect(text).toContain('Progress');
    expect(text).not.toContain('Status / amount');
    expect(text).not.toContain('Oldest');
    expect(text).toContain('GST compliance');
    expect(text).toContain('1 / 3 pending');
    expect(text).toContain('GSTR-1');
    expect(text).not.toContain('GSTR-2B');
    expect(text).toContain('Pending allocations');
    expect(text).toContain('Receipts');
    expect(text).toContain('2 / 3 pending');
    expect(text).not.toContain('Payments');
    expect(text).toContain('Pending journals');
    expect(text).toContain('Sale invoices');
    expect(text).toContain('4 / 5 pending');
    expect(text).toContain('Purchase invoices');
    expect(text).toContain('1 / 2 pending');
    expect(text).not.toContain('Bank reconciliation');
    expect(text).not.toContain('Debit');
    expect(text).not.toContain('Credit');
    expect(text).toContain('date:2026-06-19');
    expect(text).toContain('May 2026');
    const sectionHeadingText = host.querySelector('.section-heading')?.textContent ?? '';
    expect(sectionHeadingText).toContain('Reporting date');
    expect(sectionHeadingText).toContain('date:2026-06-19');
    expect(sectionHeadingText).toContain('Last completed month');
    expect(sectionHeadingText).toContain('May 2026');
    expect(sectionHeadingText).toContain('Loaded');
    expect(sectionHeadingText).toContain('datetime:2026-06-19T10:00:00.000Z');
    expect(host.querySelector('.heading-meta')).toBeNull();
    expect(host.querySelector('.dashboard-summary')).toBeNull();
    expect(host.querySelector('.section-meta')).toBeTruthy();
    expect(host.querySelectorAll('table.status-table')).toHaveLength(1);
    expect(host.querySelector('.dashboard-section--compact')).toBeTruthy();
  });

  it('does not render muted zero-pending rows', () => {
    const { fixture } = setup({ summary });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.status-row--muted')).toHaveLength(0);
  });

  it('shows an empty pending-tasks state when every row is resolved', () => {
    const { fixture } = setup({ summary: noPendingSummary });
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Pending Tasks');
    expect(text).toContain('No pending tasks through the last completed month.');
    const sectionHeadingText = host.querySelector('.section-heading')?.textContent ?? '';
    expect(sectionHeadingText).toContain('Reporting date');
    expect(sectionHeadingText).toContain('date:2026-06-19');
    expect(sectionHeadingText).toContain('Last completed month');
    expect(sectionHeadingText).toContain('May 2026');
    expect(sectionHeadingText).toContain('Loaded');
    expect(sectionHeadingText).toContain('datetime:2026-06-19T10:00:00.000Z');
    expect(host.querySelectorAll('table.status-table')).toHaveLength(0);
  });

  it('retries loading after an error', () => {
    const { fixture, loadSummary } = setup({
      error: 'Failed to load accountant dashboard.',
    });
    loadSummary.mockClear();

    const retryButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Retry'));

    expect(retryButton).toBeTruthy();
    retryButton?.click();

    expect(loadSummary).toHaveBeenCalledOnce();
    expect(loadSummary).toHaveBeenCalledWith({ branchid: 'branch-1', fiscalyearid: 'fy-1' });
  });

  it('navigates table row actions with dashboard handoff query params', () => {
    const { fixture, navigate } = setup({ summary });

    const receiptAction = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'tng-button[aria-label="View Receipts pending allocations"]',
    );

    expect(receiptAction).toBeTruthy();
    receiptAction?.click();

    expect(navigate).toHaveBeenCalledWith(['/app/trading/customer-receipt'], {
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'receipts.pendingAllocation',
      },
    });
  });
});

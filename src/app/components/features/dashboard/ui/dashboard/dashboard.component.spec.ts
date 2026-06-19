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
      greenMonths: 2,
      notStartedMonths: 0,
      partialMonths: 1,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      greenMonths: 3,
      notStartedMonths: 0,
      partialMonths: 0,
    },
  },
  pendingAllocations: {
    payments: {
      actionKey: 'payments.pendingAllocation',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    receipts: {
      actionKey: 'receipts.pendingAllocation',
      amount: 1500,
      count: 2,
      oldestDate: '2026-04-04',
    },
  },
  pendingJournals: {
    payments: {
      actionKey: 'payments.pendingJournal',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    purchaseInvoices: {
      actionKey: 'purchaseInvoices.pendingJournal',
      amount: 750,
      count: 1,
      oldestDate: '2026-04-08',
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      amount: 250,
      count: 1,
      oldestDate: '2026-04-06',
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      amount: 3000,
      count: 4,
      oldestDate: '2026-04-01',
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      count: 0,
      creditAmount: 0,
      debitAmount: 0,
      oldestDate: null,
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

  it('renders all dashboard metric groups from a loaded summary', () => {
    const { fixture } = setup({ summary });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('GST compliance');
    expect(text).toContain('GSTR-1');
    expect(text).toContain('GSTR-2B');
    expect(text).toContain('Pending allocations');
    expect(text).toContain('Receipts');
    expect(text).toContain('Payments');
    expect(text).toContain('Pending journals');
    expect(text).toContain('Sale invoices');
    expect(text).toContain('Purchase invoices');
    expect(text).toContain('Pending bank reconciliation');
    expect(text).toContain('date:2026-06-19');
    expect(text).toContain('May 2026');
  });

  it('renders null oldest dates and zero-count cards cleanly', () => {
    const { fixture } = setup({ summary });
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('—');
    expect(host.querySelectorAll('.metric-card--muted').length).toBeGreaterThan(0);
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
  });

  it('navigates action cards with dashboard handoff query params', () => {
    const { fixture, navigate } = setup({ summary });

    const receiptCard = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="button"]'),
    ).find((element) => element.getAttribute('aria-label') === 'Receipts pending allocations');

    expect(receiptCard).toBeTruthy();
    receiptCard?.click();

    expect(navigate).toHaveBeenCalledWith(['/app/trading/customer-receipt'], {
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'receipts.pendingAllocation',
      },
    });
  });
});

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { JournalLinkWorkItemService } from '../../data/journal-link-work-item';
import type { JournalLinkWorkItem } from '../../data/journal-link-work-item';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { JournalLinkWorkItemListComponent } from './journal-link-work-item-list.component';

const receiptWorkItem: JournalLinkWorkItem = {
  date: '2026-04-02',
  journals: [{ id: 'journal-1', number: 'JRN-001' }],
  linkStatus: 'partial',
  matchedAmount: 400,
  number: 'REC-001',
  partyName: 'ABC Customer',
  pendingAmount: 600,
  sourceAmount: 1000,
  sourceId: 'receipt-1',
  sourceType: 'receipt',
};

type SetupOptions = Readonly<{
  count?: number;
  listError?: Error;
  items?: readonly JournalLinkWorkItem[];
  permissions?: readonly string[];
  queryParams?: Record<string, string>;
}>;

async function setup(options: SetupOptions = {}): Promise<{
  count: ReturnType<typeof vi.fn>;
  fixture: ComponentFixture<JournalLinkWorkItemListComponent>;
  list: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
}> {
  const queryParamMap = convertToParamMap(
    options.queryParams ?? {
      sourceType: 'receipt',
      status: 'not_fully_linked',
    },
  );
  const list = vi.fn(async () => {
    if (options.listError) throw options.listError;
    return options.items ?? [receiptWorkItem];
  });
  const count = vi.fn(async () => options.count ?? (options.items ?? [receiptWorkItem]).length);
  const navigate = vi.fn();

  TestBed.configureTestingModule({
    imports: [JournalLinkWorkItemListComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(queryParamMap),
          snapshot: { queryParamMap },
        },
      },
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn((value: string | null | undefined, fallback = '-') =>
            value ? `date:${value}` : fallback,
          ),
        },
      },
      {
        provide: JournalLinkWorkItemService,
        useValue: {
          count,
          list,
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
          url: '/app/trading/customer-receipt?sourceType=receipt',
        },
      },
      {
        provide: UserSessionStore,
        useValue: {
          session: signal({
            branch: { currencycode: 'INR' },
            fiscalyear: { currencycode: 'INR' },
          }),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(JournalLinkWorkItemListComponent);
  fixture.componentRef.setInput('sourceType', 'receipt');
  fixture.componentRef.setInput('hideSourceType', true);
  fixture.detectChanges();
  TestBed.flushEffects();
  await settleAsyncWork();
  fixture.detectChanges();

  return { count, fixture, list, navigate };
}

async function settleAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

describe('JournalLinkWorkItemListComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads work items with parsed dashboard query params', async () => {
    const { count, fixture, list } = await setup({
      queryParams: {
        limit: '50',
        order: 'date ASC',
        skip: '0',
        sourceType: 'receipt',
        status: 'not_fully_linked',
      },
    });

    expect(list).toHaveBeenCalledWith({
      limit: 50,
      order: 'date ASC',
      skip: 0,
      sourceType: 'receipt',
      status: 'not_fully_linked',
    });
    expect(count).toHaveBeenCalledWith({
      limit: 50,
      order: 'date ASC',
      skip: 0,
      sourceType: 'receipt',
      status: 'not_fully_linked',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('REC-001');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('JRN-001');
  });

  it('shows the empty state when no work items match', async () => {
    const { fixture } = await setup({ count: 0, items: [] });

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No records match the dashboard journal-link filter',
    );
  });

  it('blocks loading when the accountant dashboard permission is absent', async () => {
    const { fixture, list, count } = await setup({
      permissions: ['accountingReports.trialBalance'],
    });

    expect(list).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You do not have permission to view accountant dashboard work items.',
    );
  });

  it('shows an API error state', async () => {
    const { fixture } = await setup({ listError: new Error('load failed') });

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('load failed');
  });
});

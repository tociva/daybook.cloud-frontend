import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker/fiscal-year-date-range.service';
import type { UserSession } from '../../../../management/data/user-session/user-session.model';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { LedgerStore } from '../../../data/ledger';
import { JournalDraftStore } from './journal-draft.store';

type ConfigureOptions = Readonly<{
  defaultDate?: (value?: string) => string;
  session?: UserSession | null;
  toIsoDate?: (value: unknown) => string | null;
}>;

const scopedSession = {
  name: '',
  email: '',
  userid: 'user-1',
  member: null,
  memberorgs: [],
  organization: { id: 'org-1' },
  branch: { id: 'branch-1', organizationid: 'org-1', currencycode: 'INR' },
  fiscalyear: { id: 'fy-1', startdate: '2026-04-01', enddate: '2027-03-31' },
} as unknown as UserSession;

const scopedLastDateKey = 'daybook:journal:last-date:user-1:org-1:branch-1:fy-1';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('JournalDraftStore', () => {
  function configure(options: ConfigureOptions = {}) {
    const session = signal<UserSession | null>(
      options.session !== undefined ? options.session : null,
    );
    const defaultDate = vi.fn(options.defaultDate ?? ((value?: string) => value || '2026-04-01'));
    const toIsoDate = vi.fn(
      options.toIsoDate ??
        ((value: unknown) =>
          typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null),
    );

    TestBed.configureTestingModule({
      providers: [
        JournalDraftStore,
        { provide: LedgerStore, useValue: { items: vi.fn(() => []) } },
        { provide: UserSessionStore, useValue: { session } },
        {
          provide: FiscalYearDateRangeService,
          useValue: {
            defaultDate,
            errorMessage: vi.fn(() => null),
            range: signal(null),
            toIsoDate,
          },
        },
      ],
    });

    return TestBed.inject(JournalDraftStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    installLocalStorageMock();
    localStorage.clear();
  });

  it('remembers the current journal date in scoped local storage', () => {
    const draft = configure({ session: scopedSession });

    draft.journalDateModel.set('2026-06-15');
    draft.rememberJournalDate();

    expect(localStorage.getItem(scopedLastDateKey)).toBe('2026-06-15');
  });

  it('applies the remembered journal date', () => {
    localStorage.setItem(scopedLastDateKey, '2026-05-02');
    const draft = configure({ session: scopedSession });

    draft.journalDateModel.set('2026-04-01');
    draft.applyRememberedJournalDate();

    expect(draft.journalDateModel()).toBe('2026-05-02');
  });

  it('ignores invalid remembered journal dates', () => {
    localStorage.setItem(scopedLastDateKey, 'not-a-date');
    const draft = configure({ session: scopedSession });

    draft.journalDateModel.set('2026-04-01');
    draft.applyRememberedJournalDate();

    expect(draft.journalDateModel()).toBe('2026-04-01');
  });

  it('constrains remembered journal dates through the fiscal year date service', () => {
    localStorage.setItem(scopedLastDateKey, '2027-05-01');
    const draft = configure({
      defaultDate: (value?: string) => {
        if (!value) return '2026-04-01';
        return value > '2027-03-31' ? '2027-03-31' : value;
      },
      session: scopedSession,
    });

    draft.applyRememberedJournalDate();

    expect(draft.journalDateModel()).toBe('2027-03-31');
  });

  it('resetForCreate applies the remembered journal date', () => {
    localStorage.setItem(scopedLastDateKey, '2026-05-02');
    const draft = configure({ session: scopedSession });

    draft.journalDateModel.set('2026-06-20');
    draft.resetForCreate();

    expect(draft.journalDateModel()).toBe('2026-05-02');
  });
});

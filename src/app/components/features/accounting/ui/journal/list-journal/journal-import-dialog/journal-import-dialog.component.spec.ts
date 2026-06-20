import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { JournalImportDialogComponent } from './journal-import-dialog.component';

type JournalImportDialogHarness = Readonly<{
  formatDisplayDate(value: string | null | undefined): string;
}>;

function asHarness(component: JournalImportDialogComponent): JournalImportDialogHarness {
  return component as unknown as JournalImportDialogHarness;
}

function setup() {
  const formatDisplayDate = vi.fn((value: string | null | undefined, fallback = '-') =>
    value ? '01/04/2026' : fallback,
  );

  TestBed.configureTestingModule({
    providers: [
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate,
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new JournalImportDialogComponent());

  return {
    component: asHarness(component),
    formatDisplayDate,
  };
}

describe('JournalImportDialogComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('formats dates using the session branch display format', () => {
    const { component, formatDisplayDate } = setup();

    expect(component.formatDisplayDate('2026-04-01')).toBe('01/04/2026');
    expect(formatDisplayDate).toHaveBeenCalledWith('2026-04-01', '—');
  });
});

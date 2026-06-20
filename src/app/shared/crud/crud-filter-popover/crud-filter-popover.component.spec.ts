import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import type { TngPopoverCloseReason } from '@tailng-ui/primitives';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatepickerDateAdapterService } from '../../../core/date/datepicker-date-adapter.service';
import { CrudUrlService } from '../crud-url.service';
import { CrudFilterPopoverComponent } from './crud-filter-popover.component';

type CrudFilterPopoverHarness = Readonly<{
  closePopover(): void;
  onOpenChange(open: boolean): void;
  onPopoverClosed(reason: TngPopoverCloseReason): void;
  open: WritableSignal<boolean>;
}>;

function asHarness(component: CrudFilterPopoverComponent): CrudFilterPopoverHarness {
  return component as unknown as CrudFilterPopoverHarness;
}

function setup(): CrudFilterPopoverHarness {
  TestBed.configureTestingModule({
    imports: [CrudFilterPopoverComponent],
    providers: [
      { provide: ActivatedRoute, useValue: {} },
      {
        provide: CrudUrlService,
        useValue: {
          updateFilterInUrl: vi.fn(async () => undefined),
        },
      },
      {
        provide: DatepickerDateAdapterService,
        useValue: {
          adapter: signal(null),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(CrudFilterPopoverComponent);

  return asHarness(fixture.componentInstance);
}

describe('CrudFilterPopoverComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('keeps the popover open when the primitive reports an outside-pointer close', () => {
    const component = setup();
    component.open.set(true);

    component.onPopoverClosed('outside-pointer');
    component.onOpenChange(false);

    expect(component.open()).toBe(true);
  });

  it.each(['escape', 'trigger-toggle'] as const)(
    'allows %s closes from the primitive',
    (reason) => {
      const component = setup();
      component.open.set(true);

      component.onPopoverClosed(reason);
      component.onOpenChange(false);

      expect(component.open()).toBe(false);
    },
  );

  it('allows the explicit close action to close the popover', () => {
    const component = setup();
    component.open.set(true);

    component.closePopover();

    expect(component.open()).toBe(false);
  });
});

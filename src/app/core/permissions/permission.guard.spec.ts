import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { ToastStore } from '../toast/toast.store';
import { workspacePermissionGuard } from './permission.guard';
import { PermissionsStore } from './permissions.store';

describe('workspacePermissionGuard', () => {
  const can = vi.fn();
  const warning = vi.fn();
  const parseUrl = vi.fn((url: string) => ({ redirectedTo: url }));
  const session = signal<unknown>({ member: {} });

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    session.set({ member: {} });
    TestBed.configureTestingModule({
      providers: [
        { provide: UserSessionStore, useValue: { session } },
        {
          provide: PermissionsStore,
          useValue: {
            can,
            firstAllowedWorkspaceRoute: vi.fn(() => '/app/trading/vendor'),
          },
        },
        { provide: ToastStore, useValue: { warning } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  function run(url: string): unknown {
    return TestBed.runInInjectionContext(() =>
      workspacePermissionGuard({} as never, { url } as RouterStateSnapshot),
    );
  }

  it('allows exact permitted workspace routes', () => {
    can.mockReturnValue(true);
    expect(run('/app/trading/customer/create')).toBe(true);
    expect(warning).not.toHaveBeenCalled();
  });

  it('redirects denied direct navigation and warns', () => {
    can.mockReturnValue(false);
    expect(run('/app/trading/customer/customer-1/edit')).toEqual({
      redirectedTo: '/app/trading/vendor',
    });
    expect(warning).toHaveBeenCalledWith('You do not have permission to view this page.');
  });

  it('defers permission checks until startup loads the user session', () => {
    session.set(null);
    can.mockReturnValue(false);

    expect(run('/app/accounting/ledger')).toBe(true);
    expect(can).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
    expect(parseUrl).not.toHaveBeenCalled();
  });

  it('keeps Profile outside ordinary workspace permissions', () => {
    can.mockReturnValue(false);
    expect(run('/app/profile')).toBe(true);
  });
});

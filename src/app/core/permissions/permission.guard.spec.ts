import { TestBed } from '@angular/core/testing';
import { Router, type RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStore } from '../toast/toast.store';
import { workspacePermissionGuard } from './permission.guard';
import { PermissionsStore } from './permissions.store';

describe('workspacePermissionGuard', () => {
  const can = vi.fn();
  const warning = vi.fn();
  const parseUrl = vi.fn((url: string) => ({ redirectedTo: url }));

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
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

  it('keeps Profile outside ordinary workspace permissions', () => {
    can.mockReturnValue(false);
    expect(run('/app/profile')).toBe(true);
  });
});

import { inject } from '@angular/core';
import type { CanActivateChildFn } from '@angular/router';
import { Router } from '@angular/router';
import { ToastStore } from '../toast/toast.store';
import { permissionForWorkspaceUrl } from './permission-requirements';
import { PermissionsStore } from './permissions.store';

export const workspacePermissionGuard: CanActivateChildFn = (_route, state) => {
  const requirement = permissionForWorkspaceUrl(state.url);
  if (!requirement) return true;

  const permissions = inject(PermissionsStore);
  if (permissions.can(requirement)) return true;

  inject(ToastStore).warning('You do not have permission to view this page.');
  return inject(Router).parseUrl(permissions.firstAllowedWorkspaceRoute());
};

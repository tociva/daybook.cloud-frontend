import { inject } from '@angular/core';
import type { CanActivateChildFn } from '@angular/router';
import { Router } from '@angular/router';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { ToastStore } from '../toast/toast.store';
import { permissionForWorkspaceUrl } from './permission-requirements';
import { PermissionsStore } from './permissions.store';

export const workspacePermissionGuard: CanActivateChildFn = (_route, state) => {
  const requirement = permissionForWorkspaceUrl(state.url);
  if (!requirement) return true;

  const userSessionStore = inject(UserSessionStore);
  if (!userSessionStore.session()) return true;

  const permissions = inject(PermissionsStore);
  if (permissions.can(requirement)) return true;

  inject(ToastStore).warning('You do not have permission to view this page.');
  const targetRoute = permissions.firstAllowedWorkspaceRoute();
  return inject(Router).parseUrl(targetRoute);
};

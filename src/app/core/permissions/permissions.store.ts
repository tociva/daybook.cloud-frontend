import { Injectable, computed, inject } from '@angular/core';
import { OrganizationMemberStatus, UserRoles } from '../../components/features/management/data/organization-member/organization-member.enums';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import type { UserSession } from '../../components/features/management/data/user-session/user-session.model';
import type { PermissionMatch, PermissionRequirement } from './permissions.model';
import { PERMISSION, WORKSPACE_PERMISSION_DESTINATIONS } from './permission-requirements';

type UnknownRecord = Readonly<Record<string, unknown>>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

@Injectable({ providedIn: 'root' })
export class PermissionsStore {
  private readonly userSessionStore = inject(UserSessionStore);

  readonly isOwner = computed(() => {
    const member = this.userSessionStore.session()?.member;
    return (
      member?.status === OrganizationMemberStatus.ACCEPTED && member.role === UserRoles.OWNER
    );
  });

  can(match: PermissionMatch): boolean {
    const session = this.userSessionStore.session();
    const member = session?.member;
    if (!session || !member || member.status !== OrganizationMemberStatus.ACCEPTED) return false;
    if (member.role === UserRoles.OWNER) return true;

    if ('ownerOnly' in match) return false;
    if ('allOf' in match) return match.allOf.length > 0 && match.allOf.every((item) => this.can(item));
    if ('anyOf' in match) return match.anyOf.some((item) => this.can(item));

    return this.hasExactPermission(session, match);
  }

  canAny(requirements: readonly PermissionMatch[]): boolean {
    return requirements.some((requirement) => this.can(requirement));
  }

  firstAllowedWorkspaceRoute(): string {
    if (this.can(PERMISSION.fiscalYear.accountingReports.accountantDashboard)) {
      return '/app/dashboard';
    }

    return (
      WORKSPACE_PERMISSION_DESTINATIONS.find((destination) =>
        this.can(destination.permission),
      )?.path ?? '/app/profile'
    );
  }

  private hasExactPermission(session: UserSession, requirement: PermissionRequirement): boolean {
    const permissions = asRecord(session.member?.permissions);
    if (!permissions) return false;

    let scope: UnknownRecord | null = permissions;
    if (requirement.level !== 'root') {
      const organizationId = session.organization?.id;
      if (!organizationId) return false;
      scope = asRecord(asRecord(permissions['organizations'])?.[organizationId]);
    }
    if (requirement.level === 'branch' || requirement.level === 'fiscalYear') {
      const branchId = session.branch?.id;
      if (!branchId) return false;
      scope = asRecord(asRecord(scope?.['branches'])?.[branchId]);
    }
    if (requirement.level === 'fiscalYear') {
      const fiscalYearId = session.fiscalyear?.id;
      if (!fiscalYearId) return false;
      scope = asRecord(asRecord(scope?.['fiscalyears'])?.[fiscalYearId]);
    }

    const resource = asRecord(scope?.[requirement.resource]);
    return resource?.[requirement.action] === true;
  }
}

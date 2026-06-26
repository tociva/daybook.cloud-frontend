import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAccordionComponent,
  TngAccordionItemComponent,
  TngAccordionPanelComponent,
  TngAccordionTriggerComponent,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { PageHeadingComponent } from '../../../../../shared/page-heading/page-heading.component';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../data/user-session/user-session.store';
import type { UserSessionInvitedOrganization } from '../../data/user-session/user-session.model';
import type { Branch } from '../../data/branch/branch.model';
import type { FiscalYear } from '../../data/fiscal-year/fiscal-year.model';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../data/organization-member/organization-member.enums';
import { OrganizationMemberStore } from '../../data/organization-member/organization-member.store';
import type { Organization } from '../../data/organization/organization.model';

const compareFiscalYearsByStartDate = (left: FiscalYear, right: FiscalYear): number =>
  left.startdate.localeCompare(right.startdate);

export type FiscalYearRow = Readonly<{
  rowKey: string;
  organizationId: string | null;
  branchId: string | null;
  fiscalYearId: string | null;
  fiscalYearName: string;
  startDate: string;
  endDate: string;
  currencyCode: string;
}>;

export type BranchGroup = Readonly<{
  groupKey: string;
  branch: Branch;
  organizationId: string | null;
  rows: readonly FiscalYearRow[];
}>;

export type OrganizationGroup = Readonly<{
  groupKey: string;
  organization: Organization;
  branchGroups: readonly BranchGroup[];
}>;

type InvitationAction = 'accept' | 'reject';

@Component({
  selector: 'app-select-organization',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngAccordionComponent,
    TngAccordionItemComponent,
    TngAccordionPanelComponent,
    TngAccordionTriggerComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './select-organization.component.html',
  styleUrl: './select-organization.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOrganizationComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly organizationMemberStore = inject(OrganizationMemberStore);
  private readonly userSessionStore = inject(UserSessionStore);

  protected readonly formatDate = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDate(value);
  protected readonly applyingRowKey = signal<string | null>(null);
  protected readonly invitationActionKey = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly session = computed(() => this.userSessionStore.session());
  protected readonly isLoading = computed(() => this.userSessionStore.isLoading());
  protected readonly invitations = computed<readonly UserSessionInvitedOrganization[]>(
    () => this.session()?.invitedorgs ?? [],
  );

  protected readonly organizations = computed<readonly Organization[]>(() => {
    const session = this.session();
    if (!session) return [];

    const own = (session.ownorgs ?? []) as readonly Organization[];
    const member = (session.memberorgs ?? [])
      .filter((member) => member.status === OrganizationMemberStatus.ACCEPTED)
      .map((member) => member.organization)
      .filter((org): org is Organization => Boolean(org));

    const merged = new Map<string, Organization>();
    for (const org of [...own, ...member]) {
      const key = org.id ?? org.name;
      if (!merged.has(key)) {
        merged.set(key, org);
      }
    }

    return Array.from(merged.values());
  });

  protected readonly organizationGroups = computed<readonly OrganizationGroup[]>(() =>
    this.organizations().map((organization) => this.buildOrganizationGroup(organization)),
  );

  /** Keys passed as defaultValue to the accordion so every org is expanded initially. */
  protected readonly defaultExpandedOrganizationKeys = computed<readonly string[]>(() =>
    this.organizationGroups().map((group) => group.groupKey),
  );

  protected readonly fiscalYearColumns: readonly TngTableColumn<FiscalYearRow>[] = [
    { id: 'fiscalYearName', label: 'Fiscal Year', sortable: false, width: '14rem' },
    { id: 'startDate', label: 'Start Date', sortable: false, width: '10rem' },
    { id: 'endDate', label: 'End Date', sortable: false, width: '10rem' },
    { id: 'currencyCode', label: 'Currency', sortable: false, width: '8rem' },
    { id: 'actions', label: 'Action', align: 'end', headerAlign: 'end', width: '9rem' },
  ];

  protected readonly invitationColumns: readonly TngTableColumn<UserSessionInvitedOrganization>[] =
    [
      { id: 'organizationid', label: 'Organization', sortable: false, truncate: true },
      { id: 'email', label: 'Email', sortable: false, width: '16rem' },
      { id: 'role', label: 'Role', sortable: false, width: '8rem' },
      { id: 'invitedAt', label: 'Invited At', sortable: false, width: '11rem' },
      { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '12rem' },
    ];

  protected getCurrentSelectionLabel(): string {
    const session = this.session();
    if (!session) return 'Not selected';

    const branch = session.branch?.name ?? null;
    const fiscalyear = session.fiscalyear?.name ?? null;
    const org = session.organization?.name ?? null;

    if (org && branch && fiscalyear) {
      return `${org} • ${branch} • ${fiscalyear}`;
    }
    if (org && branch) {
      return `${org} • ${branch}`;
    }
    if (org) {
      return org;
    }
    return 'Not selected';
  }

  protected isRowActive(row: FiscalYearRow): boolean {
    const session = this.session();
    if (!session) return false;
    return (
      row.organizationId !== null &&
      row.branchId !== null &&
      row.fiscalYearId !== null &&
      session.organization?.id === row.organizationId &&
      session.branch?.id === row.branchId &&
      session.fiscalyear?.id === row.fiscalYearId
    );
  }

  protected isRowApplying(row: FiscalYearRow): boolean {
    return this.applyingRowKey() === row.rowKey;
  }

  protected isInvitationActionRunning(
    invitation: UserSessionInvitedOrganization,
    action: InvitationAction,
  ): boolean {
    return this.invitationActionKey() === this.getInvitationActionKey(invitation, action);
  }

  protected trackOrganizationGroup(_: number, group: OrganizationGroup): string {
    return group.groupKey;
  }

  protected trackBranchGroup(_: number, group: BranchGroup): string {
    return group.groupKey;
  }

  protected getCurrencyDisplay(code: string): string {
    if (!code) return '—';
    try {
      const symbol =
        new Intl.NumberFormat(undefined, { style: 'currency', currency: code })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? code;
      const name =
        new Intl.DisplayNames([navigator.language || 'en'], { type: 'currency' }).of(code) ?? code;
      return `${name} (${symbol})`;
    } catch {
      return code;
    }
  }

  protected getBranchSubtitle(branch: Branch): string {
    const parts: string[] = [];
    if (branch.email) parts.push(branch.email);
    if (branch.currencycode) parts.push(branch.currencycode);
    if (branch.countrycode) parts.push(branch.countrycode);
    return parts.join(' • ');
  }

  protected getInvitationOrganizationName(invitation: UserSessionInvitedOrganization): string {
    return invitation.organization?.name ?? invitation.organizationid;
  }

  protected getInvitationOrganizationEmail(invitation: UserSessionInvitedOrganization): string {
    return invitation.organization?.email ?? '—';
  }

  protected getInvitationDate(invitation: UserSessionInvitedOrganization): string {
    const inviteTime = invitation.props?.['invitetime'];
    return typeof inviteTime === 'string' && inviteTime.trim().length > 0
      ? this.formatDate(inviteTime)
      : '—';
  }

  protected getRoleLabel(role: UserRoles): string {
    const labels: Readonly<Record<UserRoles, string>> = {
      [UserRoles.SUPER_ADMIN]: 'Super admin',
      [UserRoles.OWNER]: 'Owner',
      [UserRoles.ADMIN]: 'Admin',
      [UserRoles.USER]: 'User',
    };

    return labels[role] ?? role;
  }

  protected async applyRow(row: FiscalYearRow): Promise<void> {
    if (!row.organizationId || !row.branchId || !row.fiscalYearId) {
      this.errorMessage.set('This row is missing organization, branch or fiscal-year information.');
      return;
    }

    this.applyingRowKey.set(row.rowKey);
    this.errorMessage.set(null);

    try {
      await this.userSessionStore.selectOrganization(row.organizationId);
      await this.userSessionStore.selectBranch(row.branchId);
      await this.userSessionStore.selectFiscalYear(row.fiscalYearId);
      void this.router.navigate(['/app/dashboard']);
    } catch (error) {
      this.errorMessage.set(
        getApiErrorMessage(error, 'Failed to apply selection. Please try again.'),
      );
    } finally {
      this.applyingRowKey.set(null);
    }
  }

  protected async acceptInvitation(invitation: UserSessionInvitedOrganization): Promise<void> {
    await this.updateInvitationStatus(invitation, 'accept');
  }

  protected async rejectInvitation(invitation: UserSessionInvitedOrganization): Promise<void> {
    await this.updateInvitationStatus(invitation, 'reject');
  }

  private async updateInvitationStatus(
    invitation: UserSessionInvitedOrganization,
    action: InvitationAction,
  ): Promise<void> {
    if (!invitation.id) {
      this.errorMessage.set('This invitation is missing its member id.');
      return;
    }

    this.invitationActionKey.set(this.getInvitationActionKey(invitation, action));
    this.errorMessage.set(null);

    try {
      const success =
        action === 'accept'
          ? await this.organizationMemberStore.acceptInvitation(invitation.id)
          : await this.organizationMemberStore.rejectInvitation(invitation.id);

      if (!success) {
        this.errorMessage.set(
          this.organizationMemberStore.error() ??
            `Failed to ${action === 'accept' ? 'accept' : 'reject'} invitation.`,
        );
        return;
      }

      await this.userSessionStore.createUserSession();
    } catch (error) {
      this.errorMessage.set(
        getApiErrorMessage(
          error,
          `Failed to ${action === 'accept' ? 'accept' : 'reject'} invitation.`,
        ),
      );
    } finally {
      this.invitationActionKey.set(null);
    }
  }

  private getInvitationActionKey(
    invitation: UserSessionInvitedOrganization,
    action: InvitationAction,
  ): string {
    return `${invitation.id ?? invitation.organizationid}:${action}`;
  }

  private buildOrganizationGroup(organization: Organization): OrganizationGroup {
    const orgKey = organization.id ?? `org_${organization.name}`;
    const branches = organization.branches ?? [];

    const branchGroups: BranchGroup[] = branches.map((branch) => {
      const branchKey = branch.id ?? `branch_${branch.name}`;
      const fiscalYears = [...(branch.fiscalyears ?? [])].sort(compareFiscalYearsByStartDate);

      const rows: FiscalYearRow[] = fiscalYears.map((fy) =>
        this.buildFiscalYearRow(orgKey, branchKey, organization, branch, fy),
      );

      return {
        groupKey: `${orgKey}::${branchKey}`,
        branch,
        organizationId: organization.id ?? null,
        rows,
      };
    });

    return {
      groupKey: orgKey,
      organization,
      branchGroups,
    };
  }

  private buildFiscalYearRow(
    orgKey: string,
    branchKey: string,
    organization: Organization,
    branch: Branch,
    fiscalYear: FiscalYear,
  ): FiscalYearRow {
    const fyKey = fiscalYear.id ?? `fy_${fiscalYear.name ?? fiscalYear.startdate}`;
    return {
      rowKey: `${orgKey}::${branchKey}::${fyKey}`,
      organizationId: organization.id ?? null,
      branchId: branch.id ?? null,
      fiscalYearId: fiscalYear.id ?? null,
      fiscalYearName: fiscalYear.name ?? '',
      startDate: fiscalYear.startdate ?? '',
      endDate: fiscalYear.enddate ?? '',
      currencyCode: fiscalYear.currencycode ?? '',
    };
  }
}

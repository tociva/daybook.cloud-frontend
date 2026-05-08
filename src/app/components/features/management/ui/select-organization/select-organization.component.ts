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
import { PageHeadingComponent } from '../../../../../shared/page-heading/page-heading.component';
import { formatDisplayDate } from '../../../../../core/date/dayjs-date.utils';
import { UserSessionStore } from '../../data/user-session/user-session.store';
import type { Branch } from '../../data/branch/branch.model';
import type { FiscalYear } from '../../data/fiscal-year/fiscal-year.model';
import type { Organization } from '../../data/organization/organization.model';

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
  private readonly userSessionStore = inject(UserSessionStore);

  protected readonly formatDate = formatDisplayDate;
  protected readonly applyingRowKey = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly session = computed(() => this.userSessionStore.session());
  protected readonly isLoading = computed(() => this.userSessionStore.isLoading());

  protected readonly organizations = computed<readonly Organization[]>(() => {
    const session = this.session();
    if (!session) return [];

    const own = (session.ownorgs ?? []) as readonly Organization[];
    const member = (session.memberorgs ?? [])
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

  protected trackOrganizationGroup(_: number, group: OrganizationGroup): string {
    return group.groupKey;
  }

  protected trackBranchGroup(_: number, group: BranchGroup): string {
    return group.groupKey;
  }

  protected getBranchSubtitle(branch: Branch): string {
    const parts: string[] = [];
    if (branch.email) parts.push(branch.email);
    if (branch.currencycode) parts.push(branch.currencycode);
    if (branch.countrycode) parts.push(branch.countrycode);
    return parts.join(' • ');
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
      const message =
        error instanceof Error ? error.message : 'Failed to apply selection. Please try again.';
      this.errorMessage.set(message);
    } finally {
      this.applyingRowKey.set(null);
    }
  }

  private buildOrganizationGroup(organization: Organization): OrganizationGroup {
    const orgKey = organization.id ?? `org_${organization.name}`;
    const branches = organization.branches ?? [];

    const branchGroups: BranchGroup[] = branches.map((branch) => {
      const branchKey = branch.id ?? `branch_${branch.name}`;
      const fiscalYears = branch.fiscalyears ?? [];

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

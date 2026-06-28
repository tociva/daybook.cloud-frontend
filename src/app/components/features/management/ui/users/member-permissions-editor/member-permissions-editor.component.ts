import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  TngAccordionComponent,
  TngAccordionItemComponent,
  TngAccordionPanelComponent,
  TngAccordionTriggerComponent,
  TngCardComponent,
  TngCheckboxComponent,
  TngTabsComponent,
} from '@tailng-ui/components';
import { TngTab, TngTabList, TngTabPanel } from '@tailng-ui/primitives';
import type { Branch } from '../../../data/branch/branch.model';
import type { FiscalYear } from '../../../data/fiscal-year/fiscal-year.model';
import type { Organization } from '../../../data/organization/organization.model';
import {
  FISCAL_YEAR_PERMISSION_GROUPS,
  getDomainGroupEntries,
  getDomainsForScope,
  getGroupsForDomain,
  type PermissionDomainDef,
  type PermissionGroupDef,
} from '../../../data/organization-member/organization-member-permissions.schema';
import type {
  BranchScopePermissions,
  FiscalYearScopePermissions,
  OrganizationMemberPermissionTree,
  OrganizationScopePermissions,
  PermissionFlags,
} from '../../../data/organization-member/organization-member-permissions.model';
import {
  isGroupFullyChecked,
  isGroupPartiallyChecked,
  setFlag,
  toggleGroup,
} from '../../../data/organization-member/organization-member-permissions.util';

type OrganizationPermissionGroupKey = keyof Omit<OrganizationScopePermissions, 'branches'>;

@Component({
  selector: 'app-member-permissions-editor',
  standalone: true,
  host: {
    '[class.permissions-editor--readonly]': 'readonly()',
  },
  imports: [
    TngAccordionComponent,
    TngAccordionItemComponent,
    TngAccordionPanelComponent,
    TngAccordionTriggerComponent,
    TngCardComponent,
    TngCheckboxComponent,
    TngTab,
    TngTabList,
    TngTabPanel,
    TngTabsComponent,
  ],
  templateUrl: './member-permissions-editor.component.html',
  styleUrl: './member-permissions-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberPermissionsEditorComponent {
  readonly organization = input.required<Organization | null>();
  readonly permissions = input.required<OrganizationMemberPermissionTree>();
  readonly branchList = input<readonly Branch[] | undefined>(undefined);
  readonly branchesLoading = input(false);
  readonly readonly = input(false);
  readonly permissionsChange = output<OrganizationMemberPermissionTree>();

  protected readonly activeBranchId = signal<string | null>(null);

  protected readonly organizationDomains = getDomainsForScope('organization');
  protected readonly branchDomains = getDomainsForScope('branch');
  protected readonly fiscalYearDomains = getDomainsForScope('fiscalYear');

  protected readonly organizationId = computed(() => this.organization()?.id ?? null);

  protected readonly branches = computed(() => {
    const override = this.branchList();
    const source = override ?? this.organization()?.branches ?? [];

    return source.filter((branch): branch is Branch & { id: string } => Boolean(branch.id));
  });

  constructor() {
    effect(() => {
      const branches = this.branches();
      const current = this.activeBranchId();

      if (branches.length === 0) {
        if (current !== null) {
          this.activeBranchId.set(null);
        }
        return;
      }

      if (!current || !branches.some((branch) => branch.id === current)) {
        this.activeBranchId.set(branches[0].id);
      }
    });
  }

  protected onBranchTabChange(value: unknown): void {
    this.activeBranchId.set(typeof value === 'string' ? value : null);
  }

  protected readonly defaultExpandedOrganizationDomainKeys = computed(() =>
    this.defaultExpandedKeys(this.organizationDomains),
  );

  protected readonly defaultExpandedBranchDomainKeys = computed(() =>
    this.defaultExpandedKeys(this.branchDomains),
  );

  protected readonly defaultExpandedFiscalYearDomainKeys = computed(() =>
    this.defaultExpandedKeys(this.fiscalYearDomains),
  );

  protected organizationScope(): OrganizationScopePermissions | null {
    const organizationId = this.organizationId();
    if (!organizationId) return null;
    return this.permissions().organizations[organizationId] ?? null;
  }

  protected branchScope(branchId: string): BranchScopePermissions | null {
    return this.organizationScope()?.branches[branchId] ?? null;
  }

  protected fiscalYearScope(
    branchId: string,
    fiscalYearId: string,
  ): FiscalYearScopePermissions | null {
    return this.branchScope(branchId)?.fiscalyears[fiscalYearId] ?? null;
  }

  protected branchFiscalYears(branch: Branch): readonly (FiscalYear & { id: string })[] {
    return [...(branch.fiscalyears ?? [])]
      .filter((fiscalYear): fiscalYear is FiscalYear & { id: string } => Boolean(fiscalYear.id))
      .sort((left, right) => left.startdate.localeCompare(right.startdate));
  }

  protected domainValue(domain: PermissionDomainDef): string {
    return `${domain.scope}:${domain.key}`;
  }

  protected domainGroups(domain: PermissionDomainDef): readonly PermissionGroupDef[] {
    return getGroupsForDomain(domain);
  }

  protected organizationGroupFlags(
    scope: OrganizationScopePermissions,
    group: PermissionGroupDef,
  ): PermissionFlags {
    return scope[group.key as OrganizationPermissionGroupKey];
  }

  protected branchGroupFlags(
    scope: BranchScopePermissions,
    group: PermissionGroupDef,
  ): PermissionFlags {
    return scope[group.key as keyof Omit<BranchScopePermissions, 'fiscalyears'>];
  }

  protected fiscalYearGroupFlags(
    scope: FiscalYearScopePermissions,
    group: PermissionGroupDef,
  ): PermissionFlags {
    return scope[group.key as keyof FiscalYearScopePermissions];
  }

  protected groupActionKeys(group: PermissionGroupDef): readonly string[] {
    return group.actions.map((action) => action.key);
  }

  protected isGroupChecked(
    flags: PermissionFlags | null | undefined,
    group: PermissionGroupDef,
  ): boolean {
    if (!flags) return false;
    return isGroupFullyChecked(flags, this.groupActionKeys(group));
  }

  protected isGroupIndeterminate(
    flags: PermissionFlags | null | undefined,
    group: PermissionGroupDef,
  ): boolean {
    if (!flags) return false;
    return isGroupPartiallyChecked(flags, this.groupActionKeys(group));
  }

  protected isOrganizationDomainChecked(
    scope: OrganizationScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getOrganizationDomainFlagValues(scope, domain);
    return values.length > 0 && values.every(Boolean);
  }

  protected isOrganizationDomainIndeterminate(
    scope: OrganizationScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getOrganizationDomainFlagValues(scope, domain);
    return values.some(Boolean) && !values.every(Boolean);
  }

  protected isBranchDomainChecked(
    scope: BranchScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getBranchDomainFlagValues(scope, domain);
    return values.length > 0 && values.every(Boolean);
  }

  protected isBranchDomainIndeterminate(
    scope: BranchScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getBranchDomainFlagValues(scope, domain);
    return values.some(Boolean) && !values.every(Boolean);
  }

  protected isFiscalYearDomainChecked(
    scope: FiscalYearScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getFiscalYearDomainFlagValues(scope, domain);
    return values.length > 0 && values.every(Boolean);
  }

  protected isFiscalYearDomainIndeterminate(
    scope: FiscalYearScopePermissions,
    domain: PermissionDomainDef,
  ): boolean {
    const values = this.getFiscalYearDomainFlagValues(scope, domain);
    return values.some(Boolean) && !values.every(Boolean);
  }

  protected onOrganizationDomainToggle(domain: PermissionDomainDef, checked: boolean): void {
    this.updateOrganizationScope((organization) => {
      const next = { ...organization };
      for (const group of getGroupsForDomain(domain)) {
        next[group.key as OrganizationPermissionGroupKey] = toggleGroup(
          organization[group.key as OrganizationPermissionGroupKey],
          this.groupActionKeys(group),
          checked,
        );
      }
      return next;
    });
  }

  protected onOrganizationGroupToggle(group: PermissionGroupDef, checked: boolean): void {
    this.updateOrganizationScope((organization) => ({
      ...organization,
      [group.key]: toggleGroup(
        organization[group.key as OrganizationPermissionGroupKey],
        this.groupActionKeys(group),
        checked,
      ),
    }));
  }

  protected onOrganizationActionToggle(
    group: PermissionGroupDef,
    actionKey: string,
    checked: boolean,
  ): void {
    this.updateOrganizationScope((organization) => ({
      ...organization,
      [group.key]: {
        ...organization[group.key as OrganizationPermissionGroupKey],
        [actionKey]: checked,
      },
    }));
  }

  protected onBranchDomainToggle(
    branchId: string,
    domain: PermissionDomainDef,
    checked: boolean,
  ): void {
    this.updateBranchScope(branchId, (branch) => {
      const next = { ...branch };
      for (const group of getGroupsForDomain(domain)) {
        next[group.key as keyof Omit<BranchScopePermissions, 'fiscalyears'>] = toggleGroup(
          branch[group.key as keyof Omit<BranchScopePermissions, 'fiscalyears'>] as PermissionFlags,
          this.groupActionKeys(group),
          checked,
        );
      }
      return next;
    });
  }

  protected onBranchGroupToggle(
    branchId: string,
    group: PermissionGroupDef,
    checked: boolean,
  ): void {
    this.updateBranchScope(branchId, (branch) => ({
      ...branch,
      [group.key]: toggleGroup(
        branch[group.key as keyof Omit<BranchScopePermissions, 'fiscalyears'>] as PermissionFlags,
        this.groupActionKeys(group),
        checked,
      ),
    }));
  }

  protected onBranchActionToggle(
    branchId: string,
    group: PermissionGroupDef,
    actionKey: string,
    checked: boolean,
  ): void {
    this.updateBranchScope(branchId, (branch) => ({
      ...branch,
      [group.key]: {
        ...(branch[
          group.key as keyof Omit<BranchScopePermissions, 'fiscalyears'>
        ] as PermissionFlags),
        [actionKey]: checked,
      },
    }));
  }

  protected onFiscalYearDomainToggle(
    branchId: string,
    fiscalYearId: string,
    domain: PermissionDomainDef,
    checked: boolean,
  ): void {
    this.updateFiscalYearScope(branchId, fiscalYearId, (fiscalYear) => {
      const next = { ...fiscalYear };
      for (const group of getGroupsForDomain(domain, FISCAL_YEAR_PERMISSION_GROUPS)) {
        next[group.key as keyof FiscalYearScopePermissions] = toggleGroup(
          fiscalYear[group.key as keyof FiscalYearScopePermissions],
          this.groupActionKeys(group),
          checked,
        );
      }
      return next;
    });
  }

  protected onFiscalYearGroupToggle(
    branchId: string,
    fiscalYearId: string,
    group: PermissionGroupDef,
    checked: boolean,
  ): void {
    this.updateFiscalYearScope(branchId, fiscalYearId, (fiscalYear) => ({
      ...fiscalYear,
      [group.key]: toggleGroup(
        fiscalYear[group.key as keyof FiscalYearScopePermissions],
        this.groupActionKeys(group),
        checked,
      ),
    }));
  }

  protected onFiscalYearActionToggle(
    branchId: string,
    fiscalYearId: string,
    group: PermissionGroupDef,
    actionKey: string,
    checked: boolean,
  ): void {
    this.updateFiscalYearScope(branchId, fiscalYearId, (fiscalYear) => ({
      ...fiscalYear,
      [group.key]: {
        ...fiscalYear[group.key as keyof FiscalYearScopePermissions],
        [actionKey]: checked,
      },
    }));
  }

  private defaultExpandedKeys(domains: readonly PermissionDomainDef[]): string[] {
    return domains
      .filter((domain) => domain.key === 'management')
      .map((domain) => this.domainValue(domain));
  }

  private getOrganizationDomainFlagValues(
    scope: OrganizationScopePermissions,
    domain: PermissionDomainDef,
  ): boolean[] {
    return getDomainGroupEntries(domain).flatMap(({ group, actionKeys }) =>
      actionKeys.map((key) => Boolean(this.organizationGroupFlags(scope, group)[key])),
    );
  }

  private getBranchDomainFlagValues(
    scope: BranchScopePermissions,
    domain: PermissionDomainDef,
  ): boolean[] {
    return getDomainGroupEntries(domain).flatMap(({ group, actionKeys }) =>
      actionKeys.map((key) => Boolean(this.branchGroupFlags(scope, group)[key])),
    );
  }

  private getFiscalYearDomainFlagValues(
    scope: FiscalYearScopePermissions,
    domain: PermissionDomainDef,
  ): boolean[] {
    return getDomainGroupEntries(domain, FISCAL_YEAR_PERMISSION_GROUPS).flatMap(
      ({ group, actionKeys }) =>
        actionKeys.map((key) => Boolean(this.fiscalYearGroupFlags(scope, group)[key])),
    );
  }

  private updateOrganizationScope(
    updater: (organization: OrganizationScopePermissions) => OrganizationScopePermissions,
  ): void {
    const organizationId = this.organizationId();
    if (!organizationId) return;

    this.permissionsChange.emit(setFlag(this.permissions(), organizationId, updater));
  }

  private updateBranchScope(
    branchId: string,
    updater: (branch: BranchScopePermissions) => BranchScopePermissions,
  ): void {
    this.updateOrganizationScope((organization) => ({
      ...organization,
      branches: {
        ...organization.branches,
        [branchId]: updater(organization.branches[branchId]),
      },
    }));
  }

  private updateFiscalYearScope(
    branchId: string,
    fiscalYearId: string,
    updater: (fiscalYear: FiscalYearScopePermissions) => FiscalYearScopePermissions,
  ): void {
    this.updateBranchScope(branchId, (branch) => ({
      ...branch,
      fiscalyears: {
        ...branch.fiscalyears,
        [fiscalYearId]: updater(branch.fiscalyears[fiscalYearId]),
      },
    }));
  }
}

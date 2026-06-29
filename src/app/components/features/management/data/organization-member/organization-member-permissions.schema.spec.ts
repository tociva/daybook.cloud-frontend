import { describe, expect, it } from 'vitest';
import {
  BRANCH_PERMISSION_GROUPS,
  FISCAL_YEAR_PERMISSION_GROUPS,
  ORGANIZATION_PERMISSION_GROUPS,
  PERMISSION_DOMAINS,
  getDomainActionKeys,
  getGroupsForDomain,
  getGroupsForScope,
} from './organization-member-permissions.schema';

describe('organization-member-permissions.schema', () => {
  it('maps every permission group to exactly one domain', () => {
    const scopes = ['organization', 'branch', 'fiscalYear'] as const;

    for (const scope of scopes) {
      const allGroups = getGroupsForScope(scope);
      const domains = PERMISSION_DOMAINS.filter((domain) => domain.scope === scope);
      const assigned = new Map<string, string>();

      for (const domain of domains) {
        for (const groupKey of domain.groupKeys) {
          expect(assigned.has(groupKey), `${scope}:${groupKey} assigned twice`).toBe(false);
          assigned.set(groupKey, domain.key);
        }
      }

      for (const group of allGroups) {
        expect(assigned.has(group.key), `${scope}:${group.key} missing from domains`).toBe(true);
      }

      expect(assigned.size).toBe(allGroups.length);
    }
  });

  it('returns groups for a domain in schema order', () => {
    const tradingDomain = PERMISSION_DOMAINS.find(
      (domain) => domain.scope === 'branch' && domain.key === 'trading',
    )!;

    const groups = getGroupsForDomain(tradingDomain);
    expect(groups.map((group) => group.key)).toEqual([...tradingDomain.groupKeys]);
  });

  it('covers all action keys for domain groups', () => {
    const accountingDomain = PERMISSION_DOMAINS.find(
      (domain) => domain.scope === 'fiscalYear' && domain.key === 'accounting',
    )!;

    const domainActionKeys = getDomainActionKeys(accountingDomain);
    const groupActionKeys = getGroupsForDomain(accountingDomain, FISCAL_YEAR_PERMISSION_GROUPS).flatMap(
      (group) => group.actions.map((action) => action.key),
    );

    expect(domainActionKeys).toEqual(groupActionKeys);
    expect(domainActionKeys.length).toBeGreaterThan(0);
  });

  it('exposes the tax report permission in branch inventory reports', () => {
    const inventoryReports = BRANCH_PERMISSION_GROUPS.find(
      (group) => group.key === 'inventoryReports',
    );

    expect(inventoryReports?.actions.map((action) => action.key)).toContain('taxReport');
  });

  it('does not expose the tax report permission in fiscal year accounting reports', () => {
    const accountingReports = FISCAL_YEAR_PERMISSION_GROUPS.find(
      (group) => group.key === 'accountingReports',
    );

    expect(accountingReports?.actions.map((action) => action.key)).not.toContain('taxReport');
  });

  it('includes all organization, branch, and fiscal year groups in domains', () => {
    const organizationKeys = PERMISSION_DOMAINS.filter((domain) => domain.scope === 'organization')
      .flatMap((domain) => domain.groupKeys);
    const branchKeys = PERMISSION_DOMAINS.filter((domain) => domain.scope === 'branch').flatMap(
      (domain) => domain.groupKeys,
    );
    const fiscalYearKeys = PERMISSION_DOMAINS.filter((domain) => domain.scope === 'fiscalYear').flatMap(
      (domain) => domain.groupKeys,
    );

    expect(organizationKeys).toEqual(ORGANIZATION_PERMISSION_GROUPS.map((group) => group.key));
    expect(branchKeys).toEqual(BRANCH_PERMISSION_GROUPS.map((group) => group.key));
    expect(fiscalYearKeys).toEqual(FISCAL_YEAR_PERMISSION_GROUPS.map((group) => group.key));
  });
});

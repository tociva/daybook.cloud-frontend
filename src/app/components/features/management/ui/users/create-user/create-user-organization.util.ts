import { OrganizationMemberStatus } from '../../../data/organization-member/organization-member.enums';
import type { Organization } from '../../../data/organization/organization.model';
import type { UserSession } from '../../../data/user-session/user-session.model';

export function getAvailableOrganizations(session: UserSession | null): readonly Organization[] {
  if (!session) return [];

  const own = (session.ownorgs ?? []) as readonly Organization[];
  const member = (session.memberorgs ?? [])
    .filter((entry) => entry.status === OrganizationMemberStatus.ACCEPTED)
    .map((entry) => entry.organization)
    .filter((org): org is Organization => Boolean(org));

  const merged = new Map<string, Organization>();
  for (const organization of [...own, ...member]) {
    const key = organization.id ?? organization.name;
    if (!merged.has(key)) {
      merged.set(key, organization);
    }
  }

  return Array.from(merged.values());
}

export async function resolveOrganizationFromSession(
  session: UserSession | null,
  loadOrganizationById: (organizationId: string) => Promise<Organization | null>,
): Promise<Organization | null> {
  const sessionOrganization = session?.organization;

  if (sessionOrganization?.id && (sessionOrganization.branches?.length ?? 0) > 0) {
    return sessionOrganization;
  }

  if (sessionOrganization?.id) {
    const loaded = await loadOrganizationById(sessionOrganization.id);
    if (loaded) {
      return loaded;
    }
  }

  const availableOrganizations = getAvailableOrganizations(session);
  const organizationWithBranches = availableOrganizations.find(
    (organization) => (organization.branches?.length ?? 0) > 0,
  );
  if (organizationWithBranches?.id) {
    return organizationWithBranches;
  }

  const firstOrganization = availableOrganizations.find((organization) => organization.id);
  if (!firstOrganization?.id) {
    return sessionOrganization ?? null;
  }

  const loaded = await loadOrganizationById(firstOrganization.id);
  return loaded ?? firstOrganization;
}

export async function resolveOrganizationWithBranches(
  organizationId: string,
  preferred: Organization | null | undefined,
  loadOrganizationById: (organizationId: string) => Promise<Organization | null>,
): Promise<Organization | null> {
  if (preferred?.id === organizationId && (preferred.branches?.length ?? 0) > 0) {
    return preferred;
  }

  const loaded = await loadOrganizationById(organizationId);
  if ((loaded?.branches?.length ?? 0) > 0) {
    return loaded;
  }

  if (preferred?.id === organizationId) {
    return preferred;
  }

  return loaded ?? preferred ?? null;
}

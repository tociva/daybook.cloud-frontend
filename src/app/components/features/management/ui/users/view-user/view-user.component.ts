import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import {
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
  createEmptyPermissionTree,
  mergePermissionTree,
} from '../../../data/organization-member';
import type {
  OrganizationMember,
  OrganizationMemberPermissionTree,
} from '../../../data/organization-member';
import { BranchStore } from '../../../data/branch';
import { OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization/organization.model';
import { MemberPermissionsEditorComponent } from '../member-permissions-editor/member-permissions-editor.component';
import { resolveOrganizationWithBranches } from '../create-user/create-user-organization.util';

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
    MemberPermissionsEditorComponent,
  ],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  private readonly organizationStore = inject(OrganizationStore);
  protected readonly memberStore = inject(OrganizationMemberStore);
  protected readonly branchStore = inject(BranchStore);

  protected readonly organization = signal<Organization | null>(null);
  protected readonly permissions = signal<OrganizationMemberPermissionTree>({ organizations: {} });
  protected readonly permissionsReady = signal(false);
  protected readonly permissionsError = signal<string | null>(null);

  constructor() {
    void this.loadInitialState();
  }

  protected organizationLabel(member: OrganizationMember): string {
    return member.organization?.name ?? member.organizationid ?? '—';
  }

  protected userLabel(member: OrganizationMember): string {
    return member.user?.email ?? member.userid;
  }

  protected roleLabel(role: UserRoles): string {
    const labels: Readonly<Record<UserRoles, string>> = {
      [UserRoles.SUPER_ADMIN]: 'Super admin',
      [UserRoles.OWNER]: 'Owner',
      [UserRoles.ADMIN]: 'Admin',
      [UserRoles.USER]: 'User',
    };

    return labels[role] ?? role;
  }

  protected statusLabel(status: OrganizationMemberStatus): string {
    const labels: Readonly<Record<OrganizationMemberStatus, string>> = {
      [OrganizationMemberStatus.INVITED]: 'Invited',
      [OrganizationMemberStatus.ACCEPTED]: 'Accepted',
      [OrganizationMemberStatus.REJECTED]: 'Rejected',
      [OrganizationMemberStatus.REMOVED]: 'Removed',
      [OrganizationMemberStatus.INVITE_EXPIRED]: 'Invite expired',
      [OrganizationMemberStatus.MEMBER_EXITED]: 'Member exited',
    };

    return labels[status] ?? 'Unknown';
  }

  protected edit(): void {
    const id = this.memberStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/users', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected delete(): void {
    const id = this.memberStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/users', id, 'delete'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  private async loadInitialState(): Promise<void> {
    this.memberStore.clearError();
    this.permissionsReady.set(false);
    this.permissionsError.set(null);
    this.organization.set(null);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const member = await this.memberStore.loadMemberById(id, {
      includes: ['organization', 'user'],
    });
    if (!member) return;

    const memberOrganizationId = member.organizationid;
    if (!memberOrganizationId) {
      this.permissionsError.set('Unable to load organization for this user.');
      return;
    }

    const [memberOrganization] = await Promise.all([
      resolveOrganizationWithBranches(
        memberOrganizationId,
        member.organization ?? null,
        (organizationId) => this.organizationStore.loadOrganizationById(organizationId),
      ),
      this.branchStore.loadBranches({
        where: { organizationid: memberOrganizationId },
        includes: ['fiscalyears'],
      }),
    ]);

    if (!memberOrganization?.id) {
      this.permissionsError.set('Unable to load organization for this user.');
      return;
    }
    if (this.branchStore.error()) {
      this.permissionsError.set('Unable to load permissions for this user.');
      return;
    }

    const branches = this.branchStore
      .branches()
      .filter((branch) => branch.organizationid === memberOrganizationId);

    this.organization.set({ ...memberOrganization, branches });
    this.permissions.set(
      mergePermissionTree(
        createEmptyPermissionTree(memberOrganizationId, branches),
        member.permissions,
      ),
    );
    this.permissionsReady.set(true);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAvatarComponent,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  OrganizationMemberFacade,
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
} from '../../../data/organization-member';
import type { OrganizationMember } from '../../../data/organization-member';
import { UserSessionStore } from '../../../data/user-session/user-session.store';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [
    CanDirective,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngAvatarComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
  ],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListUsersComponent {
  private readonly router = inject(Router);
  private readonly facade = inject(OrganizationMemberFacade);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly memberStore = inject(OrganizationMemberStore);
  protected readonly hasError = computed(() => this.memberStore.error() !== null);
  protected readonly invitePermission = PERMISSION.organization.user.invite;
  protected readonly resendingMemberId = signal<string | null>(null);

  protected readonly columns: readonly TngTableColumn<OrganizationMember>[] = [
    { id: 'userid', label: 'User', sortable: true, truncate: true },
    { id: 'organizationid', label: 'Organization', sortable: true, truncate: true },
    { id: 'role', label: 'Role', sortable: true, width: '10rem' },
    { id: 'status', label: 'Status', sortable: true, width: '11rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '10rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'userid', label: 'User', placeholder: 'User id or email', type: 'text' },
    {
      id: 'role',
      label: 'Role',
      type: 'enum',
      options: [
        { label: 'Owner', value: UserRoles.OWNER },
        { label: 'Admin', value: UserRoles.ADMIN },
        { label: 'User', value: UserRoles.USER },
        { label: 'Super admin', value: UserRoles.SUPER_ADMIN },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'enum',
      options: [
        { label: 'Invited', value: OrganizationMemberStatus.INVITED },
        { label: 'Accepted', value: OrganizationMemberStatus.ACCEPTED },
        { label: 'Rejected', value: OrganizationMemberStatus.REJECTED },
        { label: 'Removed', value: OrganizationMemberStatus.REMOVED },
        { label: 'Invite expired', value: OrganizationMemberStatus.INVITE_EXPIRED },
        { label: 'Member exited', value: OrganizationMemberStatus.MEMBER_EXITED },
      ],
    },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.memberStore.loadMembers(this.memberQuery(filter)));
  }

  protected organizationLabel(member: OrganizationMember): string {
    return member.organization?.name ?? member.organizationid ?? '—';
  }

  protected userDisplayName(member: OrganizationMember): string {
    return member.user?.name ?? member.userid;
  }

  protected userEmail(member: OrganizationMember): string {
    return member.user?.email ?? '';
  }

  protected isOwner(member: OrganizationMember): boolean {
    return member.role === UserRoles.OWNER;
  }

  protected isRemoved(member: OrganizationMember): boolean {
    return member.status === OrganizationMemberStatus.REMOVED;
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

  protected statusTone(status: OrganizationMemberStatus): string {
    switch (status) {
      case OrganizationMemberStatus.ACCEPTED:
        return 'success';
      case OrganizationMemberStatus.INVITED:
        return 'pending';
      case OrganizationMemberStatus.REJECTED:
      case OrganizationMemberStatus.REMOVED:
      case OrganizationMemberStatus.INVITE_EXPIRED:
      case OrganizationMemberStatus.MEMBER_EXITED:
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected createUser(): void {
    void this.router.navigate(['/app/management/users/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewUser(member: OrganizationMember): void {
    if (member.id) {
      void this.router.navigate(['/app/management/users', member.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editUser(member: OrganizationMember): void {
    if (member.id) {
      void this.router.navigate(['/app/management/users', member.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteUser(member: OrganizationMember): void {
    if (member.id) {
      void this.router.navigate(['/app/management/users', member.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected canResendInvitation(member: OrganizationMember): boolean {
    return (
      member.status === OrganizationMemberStatus.INVITED ||
      member.status === OrganizationMemberStatus.INVITE_EXPIRED ||
      member.status === OrganizationMemberStatus.REJECTED
    );
  }

  protected async resendInvitation(member: OrganizationMember): Promise<void> {
    const id = member.id;
    if (!id || this.resendingMemberId() === id) {
      return;
    }

    this.resendingMemberId.set(id);
    try {
      await this.facade.resendInvitation(id);
    } finally {
      this.resendingMemberId.set(null);
    }
  }

  private memberQuery(filter: Lb4ListQuery): Lb4ListQuery {
    const organizationId = this.userSessionStore.session()?.organization?.id;
    return {
      ...filter,
      includes: ['organization', 'user'],
      ...(organizationId
        ? { where: { ...(filter.where ?? {}), organizationid: organizationId } }
        : {}),
    };
  }
}

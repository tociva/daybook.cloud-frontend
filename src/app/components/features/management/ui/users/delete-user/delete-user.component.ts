import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import {
  OrganizationMemberFacade,
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
} from '../../../data/organization-member';
import type { OrganizationMember } from '../../../data/organization-member';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-user.component.html',
  styleUrl: './delete-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationMemberFacade);
  protected readonly memberStore = inject(OrganizationMemberStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  protected organizationLabel(member: OrganizationMember): string {
    return member.organization?.name ?? member.organizationid ?? '—';
  }

  protected userEmail(member: OrganizationMember): string {
    return member.user?.email ?? '';
  }

  protected userLabel(member: OrganizationMember): string {
    return this.userEmail(member) || member.userid;
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

  protected async deleteUser(): Promise<void> {
    const id = this.memberStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }

  private async loadInitialState(): Promise<void> {
    this.memberStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.memberStore.loadMemberById(id, { includes: ['organization', 'user'] });
    }
  }
}

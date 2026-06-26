import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
} from '../../../data/organization-member';
import type { OrganizationMember } from '../../../data/organization-member';

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
  ],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly memberStore = inject(OrganizationMemberStore);

  constructor() {
    void this.loadInitialState();
  }

  protected organizationLabel(member: OrganizationMember): string {
    return member.organization?.name ?? member.organizationid ?? '—';
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

  protected formatJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
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

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.memberStore.loadMemberById(id, { includes: ['organization'] });
    }
  }
}

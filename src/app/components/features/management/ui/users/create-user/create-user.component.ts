import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  OrganizationMemberFacade,
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
  createEmptyPermissionTree,
  mergePermissionTree,
} from '../../../data/organization-member';
import type { OrganizationMemberPayload, OrganizationMemberPermissionTree } from '../../../data/organization-member';
import { OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization/organization.model';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import { MemberPermissionsEditorComponent } from '../member-permissions-editor/member-permissions-editor.component';
import {
  resolveOrganizationFromSession,
  resolveOrganizationWithBranches,
} from './create-user-organization.util';
import { validateEmail } from '../../../../../../shared/validation/email.util';

export type PageLoadState = 'initializing' | 'ready' | 'member-not-found' | 'no-organization';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    MemberPermissionsEditorComponent,
  ],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserComponent implements AfterViewInit {
  @ViewChild('userInputRef', { read: ElementRef }) private userInputRef!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationMemberFacade);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly memberStore = inject(OrganizationMemberStore);
  private readonly organizationStore = inject(OrganizationStore);

  private organizationid = '';
  private role = UserRoles.USER;
  private status = OrganizationMemberStatus.INVITED;
  private props: Readonly<Record<string, unknown>> | undefined;

  protected readonly id = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly loadState = signal<PageLoadState>('initializing');
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly userid = signal('');
  protected readonly organization = signal<Organization | null>(null);
  protected readonly permissions = signal<OrganizationMemberPermissionTree>({ organizations: {} });

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit User' : 'Invite User'));
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Update email and access permissions.'
      : 'Invite a user to the current organization.',
  );
  protected readonly userError = computed(() => validateEmail(this.userid(), this.submitted()));
  protected readonly hasErrors = computed(
    () => this.userError() !== null || this.formError() !== null,
  );
  protected readonly isSaveDisabled = computed(
    () => this.isSubmitting() || this.loadState() !== 'ready',
  );

  constructor() {
    void this.initialize();
  }

  ngAfterViewInit(): void {
    if (this.loadState() === 'ready') {
      this.focusEmailInput();
    }
  }

  protected onUserInput(event: Event): void {
    this.userid.set((event.target as HTMLInputElement).value);
  }

  protected onPermissionsChange(permissions: OrganizationMemberPermissionTree): void {
    this.permissions.set(permissions);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loadState() !== 'ready') return;

    this.submitted.set(true);
    this.formError.set(null);

    const payload = this.buildPayload();
    if (!payload || this.hasErrors()) return;

    this.isSubmitting.set(true);
    try {
      const id = this.id();
      if (id) {
        await this.facade.update(id, payload);
      } else {
        await this.facade.create(payload);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async initialize(): Promise<void> {
    this.memberStore.clearError();
    this.loadState.set('initializing');

    const resolvedOrganization = await resolveOrganizationFromSession(
      this.userSessionStore.session(),
      (organizationId) => this.organizationStore.loadOrganizationById(organizationId),
    );
    if (!resolvedOrganization?.id) {
      this.formError.set('No organization is selected. Please select an organization first.');
      this.loadState.set('no-organization');
      return;
    }

    const organization = await resolveOrganizationWithBranches(
      resolvedOrganization.id,
      resolvedOrganization,
      (organizationId) => this.organizationStore.loadOrganizationById(organizationId),
    );
    if (!organization?.id) {
      this.formError.set('No organization is selected. Please select an organization first.');
      this.loadState.set('no-organization');
      return;
    }

    this.organization.set(organization);
    this.organizationid = organization.id;

    const memberId = this.id();
    if (!memberId) {
      this.permissions.set(
        createEmptyPermissionTree(organization.id, organization.branches ?? []),
      );
      this.loadState.set('ready');
      this.focusEmailInput();
      return;
    }

    const member = await this.memberStore.loadMemberById(memberId, { includes: ['organization'] });
    if (!member) {
      this.loadState.set('member-not-found');
      return;
    }

    const memberOrganizationId = member.organizationid ?? organization.id;
    const memberOrganization = await resolveOrganizationWithBranches(
      memberOrganizationId,
      member.organization ?? organization,
      (organizationId) => this.organizationStore.loadOrganizationById(organizationId),
    );
    if (!memberOrganization?.id) {
      this.formError.set('Unable to load organization for this user.');
      this.loadState.set('no-organization');
      return;
    }

    this.userid.set(member.userid ?? '');
    this.organizationid = memberOrganizationId;
    this.role = member.role ?? UserRoles.USER;
    this.status = member.status ?? OrganizationMemberStatus.INVITED;
    this.props = member.props;
    this.organization.set(memberOrganization);

    this.permissions.set(
      mergePermissionTree(
        createEmptyPermissionTree(
          memberOrganizationId,
          memberOrganization.branches ?? [],
        ),
        member.permissions,
      ),
    );
    this.loadState.set('ready');
    this.focusEmailInput();
  }

  private buildPayload(): OrganizationMemberPayload | null {
    if (this.userError()) return null;
    if (!this.organizationid) {
      this.formError.set('Organization is required.');
      return null;
    }

    return {
      userid: this.userid().trim(),
      organizationid: this.organizationid,
      role: this.role,
      status: this.status,
      permissions: this.permissions(),
      ...(this.props ? { props: this.props } : {}),
    };
  }

  private focusEmailInput(): void {
    queueMicrotask(() => {
      this.userInputRef?.nativeElement.querySelector('input')?.focus();
    });
  }
}

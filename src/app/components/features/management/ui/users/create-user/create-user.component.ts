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

  protected readonly id = signal<string | null>(null);
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
  protected readonly userError = computed(() =>
    this.submitted() && this.userid().trim() === '' ? 'Email is required.' : null,
  );
  protected readonly hasErrors = computed(
    () => this.userError() !== null || this.formError() !== null,
  );

  constructor() {
    void this.initialize();
  }

  ngAfterViewInit(): void {
    this.userInputRef?.nativeElement.querySelector('input')?.focus();
  }

  protected onUserInput(event: Event): void {
    this.userid.set((event.target as HTMLInputElement).value);
  }

  protected onPermissionsChange(permissions: OrganizationMemberPermissionTree): void {
    this.permissions.set(permissions);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
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

    const organization = await this.resolveOrganization();
    if (!organization?.id) {
      this.formError.set('No organization is selected. Please select an organization first.');
      return;
    }

    this.organization.set(organization);
    this.organizationid = organization.id;

    const emptyPermissions = createEmptyPermissionTree(organization.id, organization.branches ?? []);
    this.permissions.set(emptyPermissions);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.id.set(id);
    const member = await this.memberStore.loadMemberById(id, { includes: ['organization'] });
    if (!member) return;

    this.userid.set(member.userid ?? '');
    this.organizationid = member.organizationid ?? organization.id;
    this.role = member.role ?? UserRoles.USER;
    this.status = member.status ?? OrganizationMemberStatus.INVITED;
    this.props = member.props;

    if (member.organization) {
      this.organization.set(member.organization);
    }

    this.permissions.set(
      mergePermissionTree(
        createEmptyPermissionTree(
          this.organizationid,
          this.organization()?.branches ?? organization.branches ?? [],
        ),
        member.permissions,
      ),
    );
  }

  private async resolveOrganization(): Promise<Organization | null> {
    const session = this.userSessionStore.session();
    const sessionOrganization = session?.organization;
    if (sessionOrganization?.id && (sessionOrganization.branches?.length ?? 0) > 0) {
      return sessionOrganization;
    }

    const organizationId = sessionOrganization?.id;
    if (!organizationId) {
      return sessionOrganization ?? null;
    }

    const loaded = await this.organizationStore.loadOrganizationById(organizationId);
    return loaded ?? sessionOrganization ?? null;
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
}

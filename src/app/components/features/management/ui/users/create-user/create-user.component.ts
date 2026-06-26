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
  TngTextareaComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  OrganizationMemberFacade,
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
} from '../../../data/organization-member';
import type { OrganizationMemberPayload } from '../../../data/organization-member';
import { OrganizationStore } from '../../../data/organization';
import { UserSessionStore } from '../../../data/user-session/user-session.store';

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
    TngTextareaComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
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
  protected readonly organizationStore = inject(OrganizationStore);

  protected readonly roles = [
    { label: 'Owner', value: UserRoles.OWNER },
    { label: 'Admin', value: UserRoles.ADMIN },
    { label: 'User', value: UserRoles.USER },
    { label: 'Super admin', value: UserRoles.SUPER_ADMIN },
  ] as const;

  protected readonly statuses = [
    { label: 'Invited', value: OrganizationMemberStatus.INVITED },
    { label: 'Accepted', value: OrganizationMemberStatus.ACCEPTED },
    { label: 'Rejected', value: OrganizationMemberStatus.REJECTED },
    { label: 'Removed', value: OrganizationMemberStatus.REMOVED },
    { label: 'Invite expired', value: OrganizationMemberStatus.INVITE_EXPIRED },
    { label: 'Member exited', value: OrganizationMemberStatus.MEMBER_EXITED },
  ] as const;

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly userid = signal('');
  protected readonly organizationid = signal('');
  protected readonly role = signal<UserRoles>(UserRoles.USER);
  protected readonly status = signal<OrganizationMemberStatus>(OrganizationMemberStatus.INVITED);
  protected readonly propsJson = signal('');
  protected readonly permissionsJson = signal('');

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit User' : 'Invite User'));
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Update role, status, and access metadata.'
      : 'Add a user to the current organization.',
  );
  protected readonly userError = computed(() =>
    this.submitted() && this.userid().trim() === '' ? 'User id or email is required.' : null,
  );
  protected readonly organizationError = computed(() =>
    this.submitted() && this.organizationid().trim() === '' ? 'Organization is required.' : null,
  );
  protected readonly hasErrors = computed(
    () =>
      this.userError() !== null || this.organizationError() !== null || this.formError() !== null,
  );

  constructor() {
    void this.loadOrganizations();
    this.setDefaultOrganization();
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.userInputRef?.nativeElement.querySelector('input')?.focus();
  }

  protected onUserInput(event: Event): void {
    this.userid.set((event.target as HTMLInputElement).value);
  }

  protected onOrganizationChange(event: Event): void {
    this.organizationid.set((event.target as HTMLSelectElement).value);
  }

  protected onRoleChange(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value as UserRoles);
  }

  protected onStatusChange(event: Event): void {
    this.status.set(Number((event.target as HTMLSelectElement).value) as OrganizationMemberStatus);
  }

  protected onPropsInput(event: Event): void {
    this.propsJson.set((event.target as HTMLTextAreaElement).value);
    this.formError.set(null);
  }

  protected onPermissionsInput(event: Event): void {
    this.permissionsJson.set((event.target as HTMLTextAreaElement).value);
    this.formError.set(null);
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

  private async loadInitialState(): Promise<void> {
    this.memberStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.id.set(id);
    const member = await this.memberStore.loadMemberById(id, { includes: ['organization'] });
    if (!member) return;

    this.userid.set(member.userid ?? '');
    this.organizationid.set(member.organizationid ?? '');
    this.role.set(member.role ?? UserRoles.USER);
    this.status.set(member.status ?? OrganizationMemberStatus.INVITED);
    this.propsJson.set(member.props ? JSON.stringify(member.props, null, 2) : '');
    this.permissionsJson.set(member.permissions ? JSON.stringify(member.permissions, null, 2) : '');
  }

  private setDefaultOrganization(): void {
    if (this.organizationid()) return;

    const currentOrganizationId = this.userSessionStore.session()?.organization?.id;
    if (currentOrganizationId) {
      this.organizationid.set(currentOrganizationId);
      return;
    }

    const firstOrganizationId = this.organizationStore.items()[0]?.id;
    if (firstOrganizationId) {
      this.organizationid.set(firstOrganizationId);
    }
  }

  private async loadOrganizations(): Promise<void> {
    await this.organizationStore.loadOrganizations();
    this.setDefaultOrganization();
  }

  private buildPayload(): OrganizationMemberPayload | null {
    if (this.userError() || this.organizationError()) return null;

    const props = this.parseOptionalJson(this.propsJson(), 'Props JSON must be a valid object.');
    if (props === null) return null;

    const permissions = this.parseOptionalJson(
      this.permissionsJson(),
      'Permissions JSON must be a valid object.',
    );
    if (permissions === null) return null;

    return {
      userid: this.userid().trim(),
      organizationid: this.organizationid(),
      role: this.role(),
      status: this.status(),
      ...(props ? { props } : {}),
      ...(permissions ? { permissions: permissions as Record<string, readonly string[]> } : {}),
    };
  }

  private parseOptionalJson(
    value: string,
    message: string,
  ): Readonly<Record<string, unknown>> | null | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Readonly<Record<string, unknown>>;
      }
    } catch {
      this.formError.set(message);
      return null;
    }

    this.formError.set(message);
    return null;
  }
}

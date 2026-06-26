import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
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
  TngStepperComponent,
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
import { BranchStore } from '../../../data/branch';
import { OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization/organization.model';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import { MemberPermissionsEditorComponent } from '../member-permissions-editor/member-permissions-editor.component';
import { resolveOrganizationWithBranches } from './create-user-organization.util';
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
    TngStepperComponent,
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
  protected readonly branchStore = inject(BranchStore);
  private readonly organizationStore = inject(OrganizationStore);

  private organizationid = '';
  private role = UserRoles.USER;
  private status = OrganizationMemberStatus.INVITED;
  private props: Readonly<Record<string, unknown>> | undefined;

  protected readonly id = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly loadState = signal<PageLoadState>(
    this.route.snapshot.paramMap.get('id') ? 'initializing' : 'ready',
  );
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
  protected readonly isSaveDisabled = computed(() => {
    if (this.isSubmitting()) return true;
    if (this.mode() === 'create') return false;
    return this.loadState() !== 'ready';
  });
  protected readonly setupSteps = computed(() => {
    const emailCompleted = this.userid().trim().length > 0 && this.userError() === null;

    return [
      {
        value: 'email',
        label: 'Email',
        description: 'Invitee address',
        completed: emailCompleted,
      },
      {
        value: 'permissions',
        label: 'Permissions',
        description: 'Organization & branch access',
        completed: emailCompleted,
      },
    ] as const;
  });
  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'permissions';
  });

  constructor() {
    effect(() => {
      if (this.mode() !== 'create') return;

      const branches = this.branchStore.branches();
      if (branches.length === 0) return;

      const orgId =
        this.userSessionStore.session()?.organization?.id ?? branches[0]?.organizationid;
      if (!orgId) return;

      const sessionOrg = this.userSessionStore.session()?.organization;
      this.organization.set({
        ...(sessionOrg ?? { name: '', email: '', userid: '' }),
        id: orgId,
        branches,
      });
      this.permissions.update((current) =>
        mergePermissionTree(createEmptyPermissionTree(orgId, branches), current),
      );
    });

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

    const memberId = this.id();
    if (!memberId) {
      this.initializeCreate();
      return;
    }

    await this.initializeEdit(memberId);
  }

  private initializeCreate(): void {
    const sessionOrg = this.userSessionStore.session()?.organization;
    if (sessionOrg?.id) {
      this.organization.set(sessionOrg);
      this.permissions.set(createEmptyPermissionTree(sessionOrg.id, []));
    }

    this.loadState.set('ready');
    void this.branchStore.loadBranches({ includes: ['fiscalyears'] });
    this.focusEmailInput();
  }

  private async initializeEdit(memberId: string): Promise<void> {
    this.loadState.set('initializing');

    const member = await this.memberStore.loadMemberById(memberId, { includes: ['organization'] });
    if (!member) {
      this.loadState.set('member-not-found');
      return;
    }

    const memberOrganizationId = member.organizationid;
    if (!memberOrganizationId) {
      this.formError.set('Unable to load organization for this user.');
      this.loadState.set('no-organization');
      return;
    }

    const memberOrganization = await resolveOrganizationWithBranches(
      memberOrganizationId,
      member.organization ?? null,
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
        createEmptyPermissionTree(memberOrganizationId, memberOrganization.branches ?? []),
        member.permissions,
      ),
    );
    this.loadState.set('ready');
    this.focusEmailInput();
  }

  private buildPayload(): OrganizationMemberPayload | null {
    if (this.userError()) return null;

    const base: OrganizationMemberPayload = {
      userid: this.userid().trim(),
      role: this.role,
      status: this.status,
      permissions: this.permissions(),
      ...(this.props ? { props: this.props } : {}),
    };

    if (this.mode() === 'edit') {
      if (!this.organizationid) {
        this.formError.set('Organization is required.');
        return null;
      }
      return { ...base, organizationid: this.organizationid };
    }

    return base;
  }

  private focusEmailInput(): void {
    queueMicrotask(() => {
      this.userInputRef?.nativeElement.querySelector('input')?.focus();
    });
  }
}

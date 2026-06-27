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
  TngSkeletonComponent,
  TngStepperComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  OrganizationMemberFacade,
  OrganizationMemberStore,
  createEmptyPermissionTree,
  mergePermissionTree,
} from '../../../data/organization-member';
import type {
  OrganizationMemberPermissionTree,
  OrganizationMemberUpdatePayload,
  InviteMemberPayload,
} from '../../../data/organization-member';
import { BranchStore } from '../../../data/branch';
import { OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization/organization.model';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import { MemberPermissionsEditorComponent } from '../member-permissions-editor/member-permissions-editor.component';
import { resolveOrganizationWithBranches } from './create-user-organization.util';
import { validateEmail } from '../../../../../../shared/validation/email.util';

export type PageLoadState =
  | 'initializing'
  | 'ready'
  | 'member-not-found'
  | 'no-organization'
  | 'load-error';

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
    TngSkeletonComponent,
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

  protected readonly id = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly loadState = signal<PageLoadState>('initializing');
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly organization = signal<Organization | null>(null);
  protected readonly permissions = signal<OrganizationMemberPermissionTree>({ organizations: {} });

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit User' : 'Invite User'));
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Review the user email and update access permissions.'
      : 'Invite a user to the current organization.',
  );
  protected readonly userError = computed(() => validateEmail(this.email(), this.submitted()));
  protected readonly hasErrors = computed(
    () => this.userError() !== null || this.formError() !== null,
  );
  protected readonly showSkeleton = computed(() => this.loadState() === 'initializing');
  protected readonly isSaveDisabled = computed(
    () => this.isSubmitting() || this.loadState() !== 'ready',
  );
  protected readonly setupSteps = computed(() => {
    const emailCompleted = this.email().trim().length > 0 && this.userError() === null;

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
    void this.initialize();
  }

  ngAfterViewInit(): void {
    if (this.mode() === 'create' && this.loadState() === 'ready') {
      this.focusEmailInput();
    }
  }

  protected onUserInput(event: Event): void {
    if (this.mode() === 'edit') return;
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPermissionsChange(permissions: OrganizationMemberPermissionTree): void {
    this.permissions.set(permissions);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loadState() !== 'ready') return;

    this.submitted.set(true);
    this.formError.set(null);

    if (this.hasErrors()) return;

    this.isSubmitting.set(true);
    try {
      const id = this.id();
      if (id) {
        const payload = this.buildUpdatePayload();
        await this.facade.update(id, payload);
      } else {
        const payload = this.buildInvitePayload();
        if (!payload) return;
        await this.facade.inviteMember(payload);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async initialize(): Promise<void> {
    this.memberStore.clearError();

    const memberId = this.id();
    if (!memberId) {
      await this.initializeCreate();
      return;
    }

    await this.initializeEdit(memberId);
  }

  private async initializeCreate(): Promise<void> {
    this.loadState.set('initializing');

    const sessionOrg = this.userSessionStore.session()?.organization;
    if (sessionOrg?.id) {
      this.organization.set(sessionOrg);
      this.permissions.set(createEmptyPermissionTree(sessionOrg.id, []));
    }

    await this.branchStore.loadBranches({ includes: ['fiscalyears'] });

    const branches = this.branchStore.branches();
    const orgId = sessionOrg?.id ?? branches[0]?.organizationid;
    if (orgId) {
      this.organization.set({
        ...(sessionOrg ?? { name: '', email: '', userid: '' }),
        id: orgId,
        branches,
      });
      this.permissions.update((current) =>
        mergePermissionTree(createEmptyPermissionTree(orgId, branches), current),
      );
    }

    this.loadState.set('ready');
    this.focusEmailInput();
  }

  private async initializeEdit(memberId: string): Promise<void> {
    this.loadState.set('initializing');

    const member = await this.memberStore.loadMemberById(memberId, {
      includes: ['organization', 'user'],
    });
    if (!member) {
      this.loadState.set('member-not-found');
      return;
    }

    const memberEmail = member.user?.email?.trim();
    if (!memberEmail) {
      this.formError.set('Unable to load email for this user.');
      this.loadState.set('load-error');
      return;
    }

    const memberOrganizationId = member.organizationid;
    if (!memberOrganizationId) {
      this.formError.set('Unable to load organization for this user.');
      this.loadState.set('no-organization');
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
      this.formError.set('Unable to load organization for this user.');
      this.loadState.set('no-organization');
      return;
    }
    if (this.branchStore.error()) {
      this.formError.set('Unable to load permissions for this user.');
      this.loadState.set('load-error');
      return;
    }

    const branches = this.branchStore
      .branches()
      .filter((branch) => branch.organizationid === memberOrganizationId);

    this.email.set(memberEmail);
    this.organization.set({ ...memberOrganization, branches });

    this.permissions.set(
      mergePermissionTree(
        createEmptyPermissionTree(memberOrganizationId, branches),
        member.permissions,
      ),
    );
    this.loadState.set('ready');
  }

  private buildInvitePayload(): InviteMemberPayload | null {
    if (this.userError()) return null;

    return {
      email: this.email().trim(),
      permissions: this.permissions(),
    };
  }

  private buildUpdatePayload(): OrganizationMemberUpdatePayload {
    return {
      permissions: this.permissions(),
    };
  }

  private focusEmailInput(): void {
    queueMicrotask(() => {
      this.userInputRef?.nativeElement.querySelector('input')?.focus();
    });
  }
}

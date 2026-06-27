import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { permissionForWorkspaceUrl } from '../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../core/permissions/permissions.store';

type BurlCreateButtonType = 'button' | 'submit';

@Component({
  selector: 'app-burl-create-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-create-button.component.html',
  styleUrl: './burl-create-button.component.css',
})
export class BurlCreateButtonComponent {
  private readonly permissions = inject(PermissionsStore);
  private readonly router = inject(Router);
  readonly disabled = input(false);
  readonly icon = input('save');
  readonly label = input('Create');
  readonly type = input<BurlCreateButtonType>('submit');
  readonly clicked = output<Event>();
  protected readonly isAllowed = computed(() => {
    const requirement = permissionForWorkspaceUrl(this.router.url);
    return requirement ? this.permissions.can(requirement) : true;
  });
}

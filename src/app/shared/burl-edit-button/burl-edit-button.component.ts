import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { permissionForCurrentResourceAction } from '../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../core/permissions/permissions.store';

@Component({
  selector: 'app-burl-edit-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-edit-button.component.html',
  styleUrl: './burl-edit-button.component.css',
})
export class BurlEditButtonComponent {
  private readonly permissions = inject(PermissionsStore);
  private readonly router = inject(Router);
  readonly disabled = input(false);
  readonly label = input('Edit');
  readonly clicked = output<void>();
  protected readonly isAllowed = computed(() => {
    const requirement = permissionForCurrentResourceAction(this.router.url, 'update');
    return requirement ? this.permissions.can(requirement) : false;
  });
}

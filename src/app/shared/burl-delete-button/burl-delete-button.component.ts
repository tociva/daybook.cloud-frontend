import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { permissionForCurrentResourceAction } from '../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../core/permissions/permissions.store';

@Component({
  selector: 'app-burl-delete-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-delete-button.component.html',
  styleUrl: './burl-delete-button.component.css',
})
export class BurlDeleteButtonComponent {
  private readonly permissions = inject(PermissionsStore);
  private readonly router = inject(Router);
  readonly disabled = input(false);
  readonly label = input('Delete');
  readonly clicked = output<void>();
  protected readonly isAllowed = computed(() => {
    const requirement = permissionForCurrentResourceAction(this.router.url, 'delete');
    return requirement ? this.permissions.can(requirement) : false;
  });
}

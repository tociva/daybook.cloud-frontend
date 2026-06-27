import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { permissionForCurrentResourceAction } from '../../core/permissions/permission-requirements';
import type { PermissionMatch } from '../../core/permissions/permissions.model';
import { PermissionsStore } from '../../core/permissions/permissions.store';

export type TableRowIconActionTone = 'neutral' | 'danger';

@Component({
  selector: 'app-table-row-icon-button',
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './table-row-icon-button.component.html',
  styleUrl: './table-row-icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowIconButtonComponent {
  private readonly permissions = inject(PermissionsStore);
  private readonly router = inject(Router);

  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly tone = input<TableRowIconActionTone>('neutral');
  readonly disabled = input(false);
  readonly permission = input<PermissionMatch | null>(null);
  readonly permissionAction = input<'delete' | 'update' | 'view' | null>(null);
  readonly action = output<void>();

  protected readonly isAllowed = computed(() => {
    const explicit = this.permission();
    if (explicit) return this.permissions.can(explicit);

    const action = this.permissionAction() ?? this.inferPermissionAction();
    if (!action) return true;
    const requirement = permissionForCurrentResourceAction(this.router.url, action);
    return requirement ? this.permissions.can(requirement) : false;
  });

  protected onAction(): void {
    if (this.disabled() || !this.isAllowed()) {
      return;
    }

    this.action.emit();
  }

  private inferPermissionAction(): 'delete' | 'update' | 'view' | null {
    if (this.icon() === 'eye') return 'view';
    if (this.icon() === 'pencil') return 'update';
    if (this.icon() === 'trash2') return 'delete';
    return null;
  }
}

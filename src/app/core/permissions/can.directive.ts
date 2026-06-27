import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { permission, type PermissionLevel, type PermissionMatch } from './permissions.model';
import { PermissionsStore } from './permissions.store';

@Directive({
  selector: '[appCan]',
  standalone: true,
})
export class CanDirective {
  private readonly permissions = inject(PermissionsStore);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private visible = false;

  readonly appCan = input.required<PermissionMatch | string>();

  constructor() {
    effect(() => {
      const match = this.resolveMatch(this.appCan());
      const allowed = match ? this.permissions.can(match) : false;
      if (allowed === this.visible) return;
      this.visible = allowed;
      if (allowed) {
        this.viewContainer.createEmbeddedView(this.template);
      } else {
        this.viewContainer.clear();
      }
    });
  }

  private resolveMatch(value: PermissionMatch | string): PermissionMatch | null {
    if (typeof value !== 'string') return value;
    if (value === 'ownerOnly') return { ownerOnly: true };

    const [level, resource, action, ...extra] = value.split(':');
    if (
      extra.length ||
      !resource ||
      !action ||
      !['root', 'organization', 'branch', 'fiscalYear'].includes(level)
    ) {
      return null;
    }
    return permission(level as PermissionLevel, resource, action);
  }
}

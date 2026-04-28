import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  TngAvatarComponent,
  TngBreadcrumbComponent,
  TngBreadcrumbItemComponent,
  TngMenuComponent,
  TngMenuTriggerFor,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngMenuGroupLabel, TngMenuItem, type TngMenuSelectEvent } from '@tailng-ui/primitives';
import { applyTailngTheme, defaultDarkThemePreset, defaultThemePreset } from '@tailng-ui/theme';
import { UserSessionOrganization } from '../../../core/user-session/user-session.model';

@Component({
  selector: 'app-workspace-header',
  imports: [
    TngAvatarComponent,
    TngBreadcrumbComponent,
    TngBreadcrumbItemComponent,
    TngIcon,
    TngMenuComponent,
    TngMenuTriggerFor,
    TngMenuGroupLabel,
    TngMenuItem,
  ],
  templateUrl: './workspace-header.component.html',
  styleUrl: './workspace-header.component.css',
})
export class WorkspaceHeaderComponent {
  readonly activeOrganizationName = input('No organization selected');
  readonly currentPageTitle = input('Workspace');
  readonly organizations = input<readonly UserSessionOrganization[]>([]);
  readonly userDisplayName = input('Daybook User');
  readonly logoutRequested = output<void>();
  public readonly darkMode = signal(true);
  public readonly effectiveMode = computed<'light' | 'dark'>(() =>
    this.darkMode() ? 'dark' : 'light',
  );
  protected readonly lastMenuCommand = signal<string | null>(null);

  constructor() {
    effect(() => {
      applyTailngTheme(this.darkMode() ? defaultDarkThemePreset : defaultThemePreset);
    });
  }

  public toggleMode(): void {
    this.darkMode.update((current) => !current);
  }

  protected logout(): void {
    this.logoutRequested.emit();
  }

  protected onProfileMenuSelect(event: TngMenuSelectEvent): void {
    const command = String(event.value);
    this.lastMenuCommand.set(command);

    if (command === 'logout') {
      this.logout();
    }
  }
}


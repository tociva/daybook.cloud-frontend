import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import {
  TngAccordionComponent,
  TngAccordionItemComponent,
  TngAccordionPanelComponent,
  TngAccordionTriggerComponent,
  TngListboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { filter } from 'rxjs';
import { MenuNode, workspaceSidebarMenu } from '../workspace-nav.model';

const groupSubtitleByPath: Readonly<Record<string, string>> = {
  trading: 'Sales and purchase operations',
  accounting: 'Financial books and reports',
  management: 'Organization and access setup',
};

@Component({
  selector: 'app-workspace-sidebar',
  imports: [
    RouterLink,
    TngAccordionComponent,
    TngAccordionItemComponent,
    TngAccordionPanelComponent,
    TngAccordionTriggerComponent,
    TngListboxComponent,
    TngIcon,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './workspace-sidebar.component.html',
  styleUrl: './workspace-sidebar.component.css',
})
export class WorkspaceSidebarComponent {
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);

  protected readonly menuList = workspaceSidebarMenu;
  protected readonly defaultExpandedGroups = computed(() =>
    this.menuList.filter((node) => node.children?.length).map((node) => node.path),
  );

  /**
   * Computed map: group.path → the selected child path (or null).
   * Only the panel that owns the current route gets a non-null value;
   * every other panel receives null, clearing its selection automatically.
   */
  protected readonly activeGroupPaths = computed(() => {
    const map = new Map<string, string | null>();

    for (const group of this.menuList) {
      map.set(group.path, this.getActiveGroupPath(group));
    }

    return map;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  protected getNodePath(node: MenuNode): string {
    if (node.path.startsWith('/')) {
      return node.path;
    }

    return `/app/${node.path}`;
  }

  protected getChildPath(group: MenuNode, child: MenuNode): string {
    return `${this.getNodePath(group)}/${child.path}`;
  }

  protected isRouteActive(path: string): boolean {
    const currentPath = this.currentUrl().split(/[?#]/)[0] ?? '';
    return currentPath === path || currentPath.startsWith(`${path}/`);
  }

  protected getActiveGroupPath(group: MenuNode): string | null {
    if (!group.children) {
      return null;
    }

    const activeChild = group.children.find((child) =>
      this.isRouteActive(this.getChildPath(group, child)),
    );
    return activeChild ? this.getChildPath(group, activeChild) : null;
  }

  protected getGroupSubtitle(group: MenuNode): string {
    return groupSubtitleByPath[group.path] ?? 'Workspace tools';
  }

  protected readonly getMenuNodeLabel = (node: MenuNode): string => node.name;

  protected getChildValue(group: MenuNode): (node: MenuNode) => string {
    return (node) => this.getChildPath(group, node);
  }

  protected readonly navItemTrackBy = (_index: number, node: MenuNode): string => node.path;

  protected onGroupValueChange(value: unknown): void {
    if (typeof value !== 'string' || value.length === 0) {
      return;
    }

    void this.router.navigateByUrl(value);
  }
}

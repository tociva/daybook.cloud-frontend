import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  TngAccordionComponent,
  TngAccordionItemComponent,
  TngAccordionPanelComponent,
  TngAccordionTriggerComponent,
  TngListboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

type MenuNode = Readonly<{
  path: string;
  name: string;
  children?: readonly MenuNode[];
}>;

const menuList: readonly MenuNode[] = [
  {
    path: 'trading',
    name: 'Trading',
    children: [
      { path: 'bank-cash', name: 'Bank & Cash' },
      { path: 'tax', name: 'Tax' },
      { path: 'item', name: 'Item' },
      { path: 'customer', name: 'Customer' },
      { path: 'sale-invoice', name: 'Sale Invoice' },
      { path: 'customer-receipt', name: 'Receipts' },
      { path: 'vendor', name: 'Vendor' },
      { path: 'purchase-invoice', name: 'Purchase Invoice' },
      { path: 'purchase-return', name: 'Purchase Return' },
      { path: 'vendor-payment', name: 'Payments' },
      { path: 'gst/gstr2b', name: 'GST Reconciliation' },
    ],
  },
  {
    path: 'accounting',
    name: 'Accounting',
    children: [
      { path: 'ledger', name: 'Ledger' },
      { path: 'journal', name: 'Journal' },
      { path: 'documents', name: 'Documents' },
      { path: 'reports/trial-balance', name: 'Trial balance' },
      { path: 'daybook', name: 'Daybook' },
      { path: 'reports/profit-loss', name: 'Profit and loss' },
      { path: 'reports/balance-sheet', name: 'Balance sheet' },
      { path: 'banking', name: 'Banking' },
    ],
  },
  {
    path: 'management',
    name: 'Management',
    children: [
      { path: 'organization', name: 'Organization' },
      { path: 'branch', name: 'Branch' },
      { path: 'fiscal-year', name: 'Fiscal Year' },
      { path: 'users', name: 'Users' },
    ],
  },
];

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

  protected readonly menuList = menuList;
  protected readonly defaultExpandedGroups = computed(() =>
    this.menuList.filter((node) => node.children?.length).map((node) => node.path),
  );

  /** Tracks the single globally-selected listbox path across all accordion panels. */
  private readonly selectedPath = signal<string | null>(null);

  /**
   * Computed map: group.path → the selected child path (or null).
   * Only the panel that "owns" the selected path gets a non-null value;
   * every other panel receives null, clearing its selection automatically.
   */
  protected readonly activeGroupPaths = computed(() => {
    const selected = this.selectedPath();
    const map = new Map<string, string | null>();

    for (const group of this.menuList) {
      if (!group.children?.length) {
        map.set(group.path, null);
        continue;
      }

      if (selected !== null) {
        // Give this group the value only if one of its children owns it.
        const owns = group.children.some(
          (child) => this.getChildPath(group, child) === selected,
        );
        map.set(group.path, owns ? selected : null);
      } else {
        // Fall back to router-URL-based detection (e.g. on initial load).
        map.set(group.path, this.getActiveGroupPath(group));
      }
    }

    return map;
  });

  protected getNodePath(node: MenuNode): string {
    // if (node.path.startsWith('/')) {
    //   return node.path;
    // }

    // return `/app/${node.path}`;
    return '/';
  }

  protected getChildPath(group: MenuNode, child: MenuNode): string {
    return `${this.getNodePath(group)}/${child.path}`;
  }

  protected isRouteActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(`${path}/`);
  }

  protected getActiveGroupPath(group: MenuNode): string | null {
    if (!group.children) {
      return null;
    }

    const activeChild = group.children.find((child) => this.isRouteActive(this.getChildPath(group, child)));
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
      // A deselect event — clear the global selection.
      this.selectedPath.set(null);
      return;
    }

    // Update the shared signal so all other panels lose their selection.
    this.selectedPath.set(value);
    this.router.navigateByUrl(value);
  }
}

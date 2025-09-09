import { Component, effect, inject, signal } from '@angular/core';
import { MenuNode } from '../../../util/menu/menu-node';
import { menuList } from '../../../util/menu/menu-list';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { NgClass, NgStyle } from '@angular/common';
import { MENU_ICONS } from '../../../util/menu/menu-icons';
import { ViewStore } from '../store/view/view.store';

@Component({
  selector: 'app-nav-items',
  imports: [RouterLink, NgIconComponent, NgClass, NgStyle],
  templateUrl: './nav-items.html',
  styleUrl: './nav-items.css'
})
export class NavItems {

  menus = signal<MenuNode[]>(menuList);
  // open/closed state keyed by parent path
  private openState = signal<Record<string, boolean>>({
    'trading': true,
    'accounting': true,
    'management': true,
  });

  private readonly viewStore = inject(ViewStore);
  expanded = true;

  isOpen = (path?: string) => !!this.openState()[path ?? ''];
  toggle = (path: string) =>
  this.openState.update(s => ({ ...s, [path]: !s[path] }));

  constructor(private router: Router) {
    effect(() => {
      this.expanded = this.viewStore.isSidebarExpanded();
    });
  }

  ngOnInit(): void {
    // Auto-open the parent that matches the current URL
    const current = this.router.url.replace(/^\//, ''); // remove leading slash
    for (const m of this.menus()) {
      if (m.children?.length && (current === m.path || current.startsWith(m.path + '/'))) {
        this.openState.update(s => ({ ...s, [m.path]: true }));
      }
    }
  }

  findIcon(path?: string): string {
    return MENU_ICONS[path ?? ''] ?? 'bootstrapList';
  }

}

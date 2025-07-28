import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { menuList } from '../../../util/menu-list';

@Component({
  selector: 'app-side-bar-content',
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink
    ],
  templateUrl: './side-bar-content.html',
  styleUrl: './side-bar-content.scss'
})
export class SideBarContent {
  @Input() isOpen = true;

  openSubmenus = new Set<string>();

  menuList = menuList;

  
  toggleSubmenu(name: string): void {
    if (this.openSubmenus.has(name)) {
      this.openSubmenus.delete(name);
    } else {
      this.openSubmenus.add(name);
    }
  }
  
  isSubmenuOpen(name: string): boolean {
    return this.openSubmenus.has(name);
  }

}

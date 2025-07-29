import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { menuList } from '../../../util/menu-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isMobile } from '../../../../util/daybook.util';

@Component({
  selector: 'app-side-bar-content',
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    MatTooltipModule
    ],
  templateUrl: './side-bar-content.html',
  styleUrl: './side-bar-content.scss'
})
export class SideBarContent {
  
  @Input() isOpen = true;
  @Input() isMobile = isMobile();
  @Output() closeSidebar = new EventEmitter<void>();

  openSubmenus = new Set<string>();

  menuList = menuList;

  onParentMenuClick(trigger: MatMenuTrigger) {
    // Optional: check logic, or just open
    trigger.openMenu();
  }

  onSubMenuClick() {
    if(this.isMobile){
      this.closeSidebar.emit();
    }
  }
  
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

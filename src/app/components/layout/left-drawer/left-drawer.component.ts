import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { LogoBlockSmallComponent } from '../../shared/logo-block-small/logo-block-small.component';
import { LogoBlockComponent } from '../../shared/logo-block/logo-block.component';
import { ViewStore } from '../store/view/view.store';
import { NavItems } from '../nav-items/nav-items';

@Component({
  selector: 'app-left-drawer',
  imports: [CommonModule, LogoBlockComponent, LogoBlockSmallComponent, NavItems],
  templateUrl: './left-drawer.component.html',
  styleUrl: './left-drawer.component.css'
})
export class LeftDrawerComponent {
  
  private readonly viewStore = inject(ViewStore);
  expanded = true;

  constructor() {
    effect(() => {
      this.expanded = this.viewStore.isSidebarExpanded();
    });
  }
}

import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogoBlockComponent } from '../../shared/logo-block/logo-block.component';
import { LogoBlockSmallComponent } from '../../shared/logo-block-small/logo-block-small.component';
import { ViewStore } from '../store/view/view.store';

@Component({
  selector: 'app-left-drawer',
  imports: [CommonModule, RouterLink, LogoBlockComponent, LogoBlockSmallComponent],
  templateUrl: './left-drawer.component.html',
  styleUrl: './left-drawer.component.css'
})
export class LeftDrawerComponent {
  
  readonly viewStore = inject(ViewStore);
  expanded = true;

  constructor() {
    effect(() => {
      this.expanded = this.viewStore.isSidebarExpanded();
    });
  }
}

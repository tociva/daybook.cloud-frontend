import { Component, effect, inject } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { ViewStore } from '../store/view/view.store';
import { AuthStore } from '../../core/auth/store/auth/auth.store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [NgIconComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly viewStore = inject(ViewStore);
  expanded = true;


  private readonly authStore = inject(AuthStore);

  readonly user = this.authStore.currentUser();
  constructor() {
    effect(() => {
      this.expanded = this.viewStore.isSidebarExpanded();
    });
  }
}

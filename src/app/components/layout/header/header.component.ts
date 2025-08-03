import { Component, effect, HostListener, inject } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { ViewStore } from '../store/view/view.store';
import { AuthStore } from '../../core/auth/store/auth/auth.store';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../core/auth/store/auth/auth.actions';

@Component({
  selector: 'app-header',
  imports: [NgIconComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly viewStore = inject(ViewStore);
  readonly store = inject(Store);
  expanded = true;
  showMenu = false;


  private readonly authStore = inject(AuthStore);

  readonly user = this.authStore.currentUser();
  constructor() {
    effect(() => {
      this.expanded = this.viewStore.isSidebarExpanded();
    });
  }

toggleMenu() {
  this.showMenu = !this.showMenu;
}

@HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    this.showMenu = false;
  }
}

openProfileSettings() {
  // route or open a dialog
}

logout() {
  this.store.dispatch(AuthActions.logoutKratos());
}

}

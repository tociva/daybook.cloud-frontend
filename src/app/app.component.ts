import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/auth/store/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectUser } from './core/auth/store/auth.selectors';
import { selectConfigLoaded } from './core/config/store/config.selectors';
import { UserProfile } from './util/user-profile.type';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule
  ]
})
export class AppComponent {

  private store = inject(Store);
  private configLoaded = this.store.selectSignal(selectConfigLoaded);
  private readonly hydraUser = this.store.selectSignal(selectUser);
  readonly isInitialized = this.store.selectSignal(selectIsInitialized);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  private router = inject(Router);
  user!: UserProfile;
  
  isOpen = true;

  readonly triggerAuthInit = effect(() => {
    if (this.configLoaded()) {
      this.store.dispatch(AuthActions.initializeAuth());
    }
  });

  readonly logUserEffect = effect(() => {
    const userValue = this.hydraUser();
    if (userValue) {
      this.user = userValue.profile['user'] as UserProfile;
    }
  });

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  logout(): void {
    this.store.dispatch(AuthActions.logoutKratos());
  }

toggleSidebar() {
  this.isOpen = !this.isOpen;
}

  
}

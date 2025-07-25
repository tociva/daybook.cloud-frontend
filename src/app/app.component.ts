import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/auth/store/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectIsLoading, selectUser } from './core/auth/store/auth.selectors';
import { selectConfigLoaded } from './core/config/store/config.selectors';
import { UserProfile } from './util/user-profile.type';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule]
})
export class AppComponent {

  private store = inject(Store);
  private configLoaded = this.store.selectSignal(selectConfigLoaded);
  readonly isLoading = this.store.selectSignal(selectIsLoading);
  readonly isInitialized = this.store.selectSignal(selectIsInitialized);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  readonly hydraUser = this.store.selectSignal(selectUser);

  user!: UserProfile;

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
  
}

import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/auth/store/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectIsLoading, selectUser } from './core/auth/store/auth.selectors';
import { selectConfigLoaded } from './core/config/store/config.selectors';
import { UserProfile } from './util/user-profile.type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent {

  private store = inject(Store);
  private configLoaded = this.store.selectSignal(selectConfigLoaded);
  readonly isLoading = this.store.selectSignal(selectIsLoading);
  readonly isInitialized = this.store.selectSignal(selectIsInitialized);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  readonly user = this.store.selectSignal(selectUser);

  readonly triggerAuthInit = effect(() => {
    const uri = window.location.pathname + window.location.search;
    this.store.dispatch(AuthActions.setReturnUri({ returnUri: uri }));
    if (this.configLoaded()) {
      this.store.dispatch(AuthActions.initializeAuth());
    }
  });

  readonly logUserEffect = effect(() => {
    const userValue = this.user();
    if (userValue) {
      const userProfile: UserProfile = userValue.profile['user'] as UserProfile;
      console.log('Name', userProfile.name);
      console.log('Email', userProfile.email);
      console.log('Picture', userProfile.picture);
    }
  });
  
}

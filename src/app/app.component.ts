import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/auth/store/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectIsLoading, selectUser } from './core/auth/store/auth.selectors';
import { selectConfigLoaded } from './core/config/store/config.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent {
  title = 'app';
  private store = inject(Store);
  readonly configLoaded = this.store.selectSignal(selectConfigLoaded);
  readonly isLoading = this.store.selectSignal(selectIsLoading);
  readonly isInitialized = this.store.selectSignal(selectIsInitialized);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  readonly user = this.store.selectSignal(selectUser);

  readonly triggerAuthInit = effect(() => {
    if (this.configLoaded()) {
      this.store.dispatch(AuthActions.initializeAuth());
    }
  });
}

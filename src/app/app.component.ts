
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from './components/core/auth/store/auth/auth.actions';
import { AuthStore } from './components/core/auth/store/auth/auth.store';
import { ConfigStore } from './components/core/auth/store/config/config.store';
import { createUserSession } from './components/core/auth/store/user-session/user-session.actions';
import { LoadingScreenComponent } from './components/shared/loading-screen/loading-screen.component';
import { ProgressLoader } from './components/shared/progress-loader/progress-loader';
import { Toaster } from './components/shared/toaster/toaster';

enum LoadingStatus {
  AUTH_IN_PROGRESS = 'AUTH_IN_PROGRESS',
  ORGANIZATION_SETUP_NEEDED = 'ORGANIZATION_SETUP_NEEDED',
  AUTH_COMPLETED = 'AUTH_COMPLETED',
}
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingScreenComponent, ProgressLoader, Toaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private readonly store = inject(Store);
  private readonly configStore = inject(ConfigStore);
  private readonly authStore = inject(AuthStore);
  
  status = LoadingStatus.AUTH_IN_PROGRESS;

  readonly triggerAuthInit = effect(() => {
    if (this.configStore.configLoaded()) {
      this.store.dispatch(authActions.initialize());
    }
  });
  readonly watchHydration = effect(() => {
    const isHydrated = this.authStore.isHydrationComplete();
    const user = this.authStore.user();
  
    this.status = isHydrated
      ? LoadingStatus.AUTH_COMPLETED
      : LoadingStatus.AUTH_IN_PROGRESS;
  
    if (this.status === LoadingStatus.AUTH_COMPLETED && user) {
      this.store.dispatch(createUserSession());
    }
  });
  

}

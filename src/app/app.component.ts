
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthStatus } from './components/core/auth/store/auth/auth.model';
import { AuthStore } from './components/core/auth/store/auth/auth.store';
import { configActions } from './components/core/auth/store/config/config.actions';
import { LoadingScreenComponent } from './components/shared/loading-screen/loading-screen.component';
import { ProgressLoader } from './components/shared/progress-loader/progress-loader';
import { Toaster } from './components/shared/toaster/toaster';
import { authActions } from './components/core/auth/store/auth/auth.actions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,LoadingScreenComponent, ProgressLoader, Toaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private readonly store = inject(Store);
  private readonly authStore = inject(AuthStore);

  
  status = this.authStore.status;

  readonly AuthStatus = AuthStatus;

  readonly triggerConfigLoad = effect(() => {
    switch(this.authStore.status()) {
      case AuthStatus.UN_INITIALIZED:
        this.store.dispatch(configActions.load());
        break;
      case AuthStatus.CONFIG_LOADED:
        this.store.dispatch(authActions.initialize());
        break;
    }
  });

}

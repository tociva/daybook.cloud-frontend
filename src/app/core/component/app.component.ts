
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStatus } from '../../components/core/auth/store/auth/auth.model';
import { AuthStore } from '../../components/core/auth/store/auth/auth.store';
import { ProgressLoader } from '../../components/shared/progress-loader/progress-loader';
import { Toaster } from '../../components/shared/toaster/toaster';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressLoader, Toaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  // private readonly store = inject(Store);
  private readonly authStore = inject(AuthStore);

  
  status = this.authStore.status;

  readonly AuthStatus = AuthStatus;

  // readonly triggerConfigLoad = effect(() => {
  //   switch(this.authStore.status()) {
  //     case AuthStatus.UN_INITIALIZED:
  //       this.store.dispatch(configActions.load());
  //       break;
  //     case AuthStatus.CONFIG_LOADED:
  //       this.store.dispatch(authActions.initialize());
  //       break;
  //   }
  // });

}

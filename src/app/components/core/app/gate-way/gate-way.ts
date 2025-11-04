import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../auth/store/auth/auth.actions';
import { AuthStatus } from '../../auth/store/auth/auth.model';
import { AuthStore } from '../../auth/store/auth/auth.store';
import { userSessionActions } from '../../auth/store/user-session/user-session.actions';

@Component({
  selector: 'app-gate-way',
  imports: [RouterOutlet, LoadingScreenComponent],
  templateUrl: './gate-way.html',
  styleUrl: './gate-way.css'
})
export class GateWay {

  private readonly store = inject(Store);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router); 
  status = this.authStore.status;

  readonly AuthStatus = AuthStatus;

  readonly triggerConfigLoad = effect(() => {
    const status = this.authStore.status();
    switch(status) {
      case AuthStatus.USER_MANAGER_INITIALIZED:
        this.store.dispatch(authActions.hydration());
        return;
      case AuthStatus.HYDRATED_NO_USER:
      case AuthStatus.HYDRATED_EXPIRED_USER:
      case AuthStatus.HYDRATED_ERROR:
        console.log('navigate to login', status);
        this.router.navigate(['/auth/login']);
        return;
      case AuthStatus.AUTHENTICATED:
      case AuthStatus.HYDRATED_VALID_USER:
        this.store.dispatch(userSessionActions.createUserSession());
        return;
    }
  });
}

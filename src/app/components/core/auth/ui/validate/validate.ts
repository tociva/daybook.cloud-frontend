import { Component, computed, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../store/auth/auth.actions';
import { AuthStatus } from '../../store/auth/auth.model';
import { AuthStore } from '../../store/auth/auth.store';
import { configActions } from '../../store/config/config.actions';
import { userSessionActions } from '../../store/user-session/user-session.actions';


@Component({
  selector: 'app-validate',
  imports: [LoadingScreenComponent],
  templateUrl: './validate.html',
  styleUrl: './validate.css'
})
export class Validate {

private readonly store = inject(Store);
private readonly authStore = inject(AuthStore);

private readonly statusSig = computed(
  () => this.authStore.status(),
  { equal: Object.is }
);

  private readonly authStatusChangeEffect = effect(() => {
    const status = this.statusSig(); // re-runs only when status actually changes

    console.log('authStatusChangeEffect', status);
    switch(status) {
      case AuthStatus.UN_INITIALIZED:
        this.store.dispatch(configActions.load());
        break;
      case AuthStatus.CONFIG_LOADED:
        this.store.dispatch(authActions.initialize());
        break;
      case AuthStatus.USER_MANAGER_INITIALIZED:
        this.store.dispatch(authActions.hydration());
        break;
      case AuthStatus.HYDRATED_VALID_USER:
        this.store.dispatch(userSessionActions.createUserSession());
        break;
      case AuthStatus.HYDRATED_NO_USER:
      case AuthStatus.HYDRATED_EXPIRED_USER:
        case AuthStatus.HYDRATED_ERROR:
        this.store.dispatch(authActions.performRedirect({ returnUri: '/auth/login' }));
        break;
      case AuthStatus.UNAUTHENTICATED:
        this.store.dispatch(authActions.logoutHydra());
        break;
      case AuthStatus.AUTHENTICATED_VALID_USER:
        this.store.dispatch(authActions.performRedirect({ returnUri: this.authStore.returnUri() ?? '/app/dashboard' }));
        break;
    }
  });

  ngOnDestroy(): void {
    this.authStatusChangeEffect.destroy();
  }
}

import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../store/auth/auth.actions';
import { AuthStatus } from '../../store/auth/auth.model';
import { AuthStore } from '../../store/auth/auth.store';
import { configActions } from '../../store/config/config.actions';
import { UserSessionStore } from '../../store/user-session/user-session.store';

@Component({
  selector: 'app-callback',
  imports: [LoadingScreenComponent],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnDestroy {

  private readonly store = inject(Store);


  private readonly authStore = inject(AuthStore);
  private readonly userSessionStore = inject(UserSessionStore);

  private readonly statusSig = computed(
    () => this.authStore.status(),
    { equal: Object.is }
  );
  
  private readonly authStatusChangeEffect = effect(() => {
    const status = this.statusSig(); // re-runs only when status actually changes

    switch(status) {
      case AuthStatus.UN_INITIALIZED:
        this.store.dispatch(configActions.load());
        break;
      case AuthStatus.CONFIG_LOADED:
        this.store.dispatch(authActions.initialize());
        break;
      case AuthStatus.USER_MANAGER_INITIALIZED:
      
      queueMicrotask(() => {
        this.store.dispatch(authActions.handleCallback());
      });
      break;
      case AuthStatus.AUTHENTICATED_VALID_USER:
        const session = this.userSessionStore.session();
        if(!session || !session.ownorgs || session.ownorgs.length === 0) {
          this.store.dispatch(authActions.performRedirect({ returnUri: '/bootstrap/bootstrap-organization' }));
          return;
        }
        this.store.dispatch(authActions.performRedirect({ returnUri: this.authStore.returnUri() ?? '/app/dashboard' }));
        break;
    }
  });

  ngOnDestroy(): void {
    this.authStatusChangeEffect.destroy();
  }

}
import { Component, computed, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../store/auth/auth.actions';
import { ConfigStore } from '../../store/config/config.store';
import { AuthStatus } from '../../store/auth/auth.model';
import { configActions } from '../../store/config/config.actions';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'app-callback',
  imports: [LoadingScreenComponent],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent {
  private readonly configStore = inject(ConfigStore);
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
        
        queueMicrotask(() => {
          this.store.dispatch(authActions.handleCallback());
        });
        break;
    }
  });


}
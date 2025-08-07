import { Component, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../store/auth/auth.actions';
import { ConfigStore } from '../../store/config/config.store';

@Component({
  selector: 'app-callback',
  imports: [LoadingScreenComponent],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent {
  private readonly configStore = inject(ConfigStore);
  private readonly store = inject(Store);
  
  readonly triggerAuthInit = effect(() => {
    if (this.configStore.configLoaded()) {
      // Delay dispatch to let sessionStorage initialize
      queueMicrotask(() => {
        this.store.dispatch(authActions.handleCallback());
      });
    }
  });


}

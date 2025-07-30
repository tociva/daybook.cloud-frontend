import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';
import { selectConfigLoaded } from '../../../config/store/config.selectors';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent {
  private store = inject(Store);
  
  readonly configLoaded = this.store.selectSignal(selectConfigLoaded);
  
  readonly triggerAuthInit = effect(() => {
    if (this.configLoaded()) {
      // Delay dispatch to let sessionStorage initialize
      queueMicrotask(() => {
        this.store.dispatch(AuthActions.handleCallback());
      });
    }
  });
  
}

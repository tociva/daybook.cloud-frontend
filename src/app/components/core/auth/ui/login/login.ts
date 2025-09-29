import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';
import { authActions } from '../../store/auth/auth.actions';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'app-login',
  imports: [LogoBlockComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  readonly store = inject(Store);
  readonly authStore = inject(AuthStore);
  
  doLogin() {
    this.store.dispatch(authActions.login({ returnUri: '/app' }));
  }
}

import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from '../store/auth/auth.actions';
import { LogoBlockComponent } from '../../../shared/logo-block/logo-block.component';

@Component({
  selector: 'app-login-failure',
  imports: [LogoBlockComponent],
  templateUrl: './login-failure.component.html',
  styleUrl: './login-failure.component.css'
})
export class LoginFailureComponent {

  readonly store = inject(Store);

  retryLogin() {
    this.store.dispatch(AuthActions.login({ returnUri: '/' }));
  }
  
  logoutCompletely() {
    this.store.dispatch(AuthActions.logoutKratos());
  }

  
}

import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { authActions } from '../../store/auth/auth.actions';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';

@Component({
  selector: 'app-login-failure',
  imports: [LogoBlockComponent],
  templateUrl: './login-failure.component.html',
  styleUrl: './login-failure.component.css'
})
export class LoginFailureComponent {

  readonly store = inject(Store);

  retryLogin() {
    this.store.dispatch(authActions.login({ returnUri: '/' }));
  }
  
  logoutCompletely() {
    this.store.dispatch(authActions.logoutKratos());
  }

  
}

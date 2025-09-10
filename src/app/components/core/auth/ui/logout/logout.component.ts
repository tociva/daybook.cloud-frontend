import { Component, inject } from '@angular/core';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '../../store/auth/auth.actions';

@Component({
  selector: 'app-logout',
  imports: [RouterLink, LogoBlockComponent],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {

  readonly store = inject(Store);
  
  logoutCompletely() {
    this.store.dispatch(authActions.logoutKratos());
  }
}

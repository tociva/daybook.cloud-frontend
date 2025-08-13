import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { userSessionActions } from '../../store/user-session/user-session.actions';

@Component({
  selector: 'app-do-logout',
  imports: [LoadingScreenComponent],
  templateUrl: './do-logout.component.html',
  styleUrl: './do-logout.component.css'
})
export class DoLogoutComponent {

  constructor(private readonly store: Store) {
    this.store.dispatch(userSessionActions.clearUserSession());
  }
}

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { logoutKratos } from '../../store/auth/auth.actions';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';

@Component({
  selector: 'app-do-logout',
  imports: [LoadingScreenComponent],
  templateUrl: './do-logout.component.html',
  styleUrl: './do-logout.component.css'
})
export class DoLogoutComponent {

  constructor(private readonly store: Store) {
    this.store.dispatch(logoutKratos());
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-silent-callback',
  imports: [CommonModule],
  templateUrl: './silent-callback.component.html',
  styleUrl: './silent-callback.component.scss'
})
export class SilentCallbackComponent {
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(AuthActions.handleSilentCallback());
  }
}

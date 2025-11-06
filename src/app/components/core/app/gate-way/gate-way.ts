import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingScreenComponent } from '../../../shared/loading-screen/loading-screen.component';
import { AuthStatus } from '../../auth/store/auth/auth.model';
import { AuthStore } from '../../auth/store/auth/auth.store';

@Component({
  selector: 'app-gate-way',
  imports: [RouterOutlet, LoadingScreenComponent],
  templateUrl: './gate-way.html',
  styleUrl: './gate-way.css'
})
export class GateWay {

  private readonly authStore = inject(AuthStore);
  status = this.authStore.status;

  readonly AuthStatus = AuthStatus;
}

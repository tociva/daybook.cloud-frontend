import { Component, computed, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { authActions } from '../../store/auth/auth.actions';
import { AuthStatus } from '../../store/auth/auth.model';
import { AuthStore } from '../../store/auth/auth.store';
import { configActions } from '../../store/config/config.actions';
import { userSessionActions } from '../../store/user-session/user-session.actions';
import { UserSessionStore } from '../../store/user-session/user-session.store';
import { AuthValidateService } from '../../auth-validate.service';


@Component({
  selector: 'app-validate',
  imports: [LoadingScreenComponent],
  templateUrl: './validate.html',
  styleUrl: './validate.css'
})
export class Validate {

private readonly store = inject(Store);
private readonly authStore = inject(AuthStore);
private readonly userSessionStore = inject(UserSessionStore);
private readonly authValidateService = inject(AuthValidateService);

private readonly statusSig = computed(
  () => this.authStore.status(),
  { equal: Object.is }
);

  private readonly authStatusChangeEffect = effect(() => {
    const status = this.statusSig(); // re-runs only when status actually changes
    this.authValidateService.doAuthValidation(status);
  });

  ngOnDestroy(): void {
    this.authStatusChangeEffect.destroy();
  }
}

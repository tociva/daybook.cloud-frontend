import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';
import { AuthValidateService } from '../../auth-validate.service';
import { authActions } from '../../store/auth/auth.actions';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'app-login',
  imports: [LogoBlockComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnDestroy {

  private readonly store = inject(Store);
  readonly authStore = inject(AuthStore);
  private readonly authValidateService = inject(AuthValidateService);

  private readonly statusSig = computed(
    () => this.authStore.status(),
    { equal: Object.is }
  );

  private readonly authStatusChangeEffect = effect(() => {
    const status = this.statusSig(); 
    this.authValidateService.doAuthValidation(status);
  });
  
  ngOnDestroy(): void {
    this.authStatusChangeEffect.destroy();
  }
  doLogin() {
    this.store.dispatch(authActions.login({ returnUri: '/app' }));
  }
}

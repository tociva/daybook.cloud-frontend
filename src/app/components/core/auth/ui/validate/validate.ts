import { Component, computed, effect, inject } from '@angular/core';
import { LoadingScreenComponent } from '../../../../shared/loading-screen/loading-screen.component';
import { AuthValidateService } from '../../auth-validate.service';
import { AuthStore } from '../../store/auth/auth.store';


@Component({
  selector: 'app-validate',
  imports: [LoadingScreenComponent],
  templateUrl: './validate.html',
  styleUrl: './validate.css'
})
export class Validate {

private readonly authStore = inject(AuthStore);
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

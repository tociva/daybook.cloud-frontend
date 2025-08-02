import { Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfigStore } from './components/core/auth/store/config/config.store';
import * as AuthActions from './components/core/auth/store/auth/auth.actions';
import { AuthStore } from './components/core/auth/store/auth/auth.store';
import { CommonModule } from '@angular/common';
import { LoadingScreenComponent } from './components/shared/loading-screen/loading-screen.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule,RouterOutlet,LoadingScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private readonly store = inject(Store);
  private readonly configStore = inject(ConfigStore);
  private readonly authStore = inject(AuthStore);

  readonly triggerAuthInit = effect(() => {
    if (this.configStore.configLoaded()) {
      this.store.dispatch(AuthActions.initializeAuth());
    }
  });

  beforeHydration = computed(() => !this.authStore.isHydrationComplete());

}

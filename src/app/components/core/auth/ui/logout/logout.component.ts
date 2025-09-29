import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { multiDecode } from '../../../../../util/common.util';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';
import { authActions } from '../../store/auth/auth.actions';
import { userSessionActions } from '../../store/user-session/user-session.actions';

@Component({
  selector: 'app-logout',
  imports: [ LogoBlockComponent],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly store = inject(Store);

  // 1) Read the raw ?error=... param reactively
  readonly errorRaw = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('error'))),
    { initialValue: null }
  );

  // 2) Safely multi-decode (handles %25257B... style double/triple encoding)
  readonly errorDecoded = computed(() => multiDecode(this.errorRaw()));

  // 3) Try to parse JSON for nicer display/logic
  readonly errorJson = computed<object | null>(() => {
    const s = this.errorDecoded();
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  });

  readonly hasError = computed(() => !!this.errorDecoded());

  readonly errorTitle = computed(() => {
    const ej = this.errorJson();
    return ej && (ej as any)?.statusText
      ? (ej as any).statusText
      : 'We couldn’t complete the logout';
  });

  readonly errorMessage = computed(() => {
    const ej = this.errorJson();
    if (ej && (ej as any)?.message) return (ej as any).message as string;
    return this.errorDecoded() || 'Something went wrong during logout.';
  });

  logoutCompletely() {
    this.store.dispatch(userSessionActions.clearUserSessionSuccess());
  }

  loginAganin() {
    this.store.dispatch(authActions.login({ returnUri: '/app' }));
  }
}

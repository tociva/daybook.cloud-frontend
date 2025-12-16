import { inject, Injectable } from "@angular/core";
import { configActions } from "./store/config/config.actions";
import { AuthStatus } from "./store/auth/auth.model";
import { authActions } from "./store/auth/auth.actions";
import { Store } from "@ngrx/store";
import { UserSessionStore } from "./store/user-session/user-session.store";
import { userSessionActions } from "./store/user-session/user-session.actions";
import { AuthStore } from "./store/auth/auth.store";

@Injectable({
  providedIn: 'root'
})
export class AuthValidateService {

  private readonly store = inject(Store);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly authStore = inject(AuthStore);

  doAuthValidation = (status: AuthStatus) => {
    switch(status) {
      case AuthStatus.UN_INITIALIZED:
        this.store.dispatch(configActions.load());
        break;
      case AuthStatus.CONFIG_LOADED:
        this.store.dispatch(authActions.initialize());
        break;
      case AuthStatus.USER_MANAGER_INITIALIZED:
        this.store.dispatch(authActions.hydration());
        break;
      case AuthStatus.HYDRATED_VALID_USER:
        this.store.dispatch(userSessionActions.createUserSession());
        break;
      case AuthStatus.HYDRATED_NO_USER:
      case AuthStatus.HYDRATED_EXPIRED_USER:
        case AuthStatus.HYDRATED_ERROR:
        // this.store.dispatch(authActions.performRedirect({ returnUri: '/auth/login' }));
        this.store.dispatch(authActions.login({ returnUri: '/app' }));
        break;
      case AuthStatus.UNAUTHENTICATED:
        this.store.dispatch(authActions.logoutHydra());
        break;
      case AuthStatus.AUTHENTICATED_VALID_USER:
        const session = this.userSessionStore.session();
        if(!session || !session.ownorgs || session.ownorgs.length === 0) {
          this.store.dispatch(authActions.performRedirect({ returnUri: '/bootstrap/bootstrap-organization' }));
          return;
        }
        this.store.dispatch(authActions.performRedirect({ returnUri: this.authStore.returnUri() ?? '/app/dashboard' }));
        break;
    }
  }
  
}
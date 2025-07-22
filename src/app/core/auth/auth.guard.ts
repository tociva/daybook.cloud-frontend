import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectConfigState } from './store/config.selectors';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);

  return store.select(selectConfigState).pipe(
    take(1),
    map((configState) => {
      const loginUrl = configState.config.consentAppLoginUrl;
      console.log('configState', configState);
      console.log('loginUrl', loginUrl);
      if (!loginUrl) {
        // Use the config URL if available, fallback if not
        const url = loginUrl || 'https://login.daybook.com/login';
        window.location.href = url + '?return_url=' + encodeURIComponent(window.location.href);
        return false;
      }
      return true;
    })
  );
};

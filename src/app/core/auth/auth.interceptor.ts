// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { getUserManager, isUserManagerInitialized } from './user-manager-singleton';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isUserManagerInitialized()) {
    return next(req);
  }

  return from(getUserManager().getUser()).pipe(
    switchMap(user => {
      const token = user?.access_token;
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
      return next(req);
    })
  );
};

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  bootstrapOrganization,
  bootstrapOrganizationFailure,
  bootstrapOrganizationSuccess,
} from './organization.actions';
import { tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { handleHttpEffect } from '../../../../../util/handle-http-effect';

@Injectable()
export class OrganizationEffects {
  private readonly http = inject(HttpClient);
  private readonly configStore = inject(ConfigStore);
  private readonly store = inject(OrganizationStore);

  private get baseUrl(): string {
    const envConfig = this.configStore.config();
    return `${envConfig.apiBaseUrl}/organization/organization`;
  }

  // ✅ Refactored bootstrap effect using handleHttpEffect
  readonly bootstrapOrganization$ = handleHttpEffect({
    trigger: bootstrapOrganization,
    actionName: 'bootstrapOrganization',
    httpCall: (http, action) =>
      http.post<Organization>(`${this.baseUrl}/bootstrap`, action.organization),
    onSuccess: (organization) => bootstrapOrganizationSuccess({ organization }),
    onError: (error) => bootstrapOrganizationFailure({ error }),
    successMessage: 'Organization bootstrapped!',
    errorMessage: 'Failed to bootstrap organization.'
  });

  // ✅ Handle success
  readonly bootstrapSuccess$ = createEffect(
    () =>
      inject(Actions).pipe(
        ofType(bootstrapOrganizationSuccess),
        tap(({ organization }) => {
          this.store.setItems([organization]);
        })
      ),
    { dispatch: false }
  );

  // ✅ Handle failure
  readonly bootstrapFailure$ = createEffect(
    () =>
      inject(Actions).pipe(
        ofType(bootstrapOrganizationFailure),
        tap(({ error }) => {
          this.store.setError(error);
        })
      ),
    { dispatch: false }
  );
}

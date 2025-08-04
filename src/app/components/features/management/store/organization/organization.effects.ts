import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  bootstrapOrganization,
  bootstrapOrganizationFailure,
  bootstrapOrganizationSuccess,
} from './organization.actions';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';

@Injectable()
export class OrganizationEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly store = inject(OrganizationStore);
  private readonly configStore = inject(ConfigStore);

  private get baseUrl(): string {
    const envConfig = this.configStore.config();
    return `${envConfig.apiBaseUrl}/organization/organization`;
  }


  bootstrapOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(bootstrapOrganization),
      switchMap(({ organization }) =>
        this.http
          .post<Organization>(`${this.baseUrl}/bootstrap`, organization)
          .pipe(
            map((response) => bootstrapOrganizationSuccess({ organization: response })),
            catchError((error) => of(bootstrapOrganizationFailure({ error })))
          )
      )
    )
  );

  bootstrapSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(bootstrapOrganizationSuccess),
        tap(({ organization }) => {
          this.store.setItems([organization]);
        })
      ),
    { dispatch: false }
  );

  bootstrapFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(bootstrapOrganizationFailure),
        tap(({ error }) => {
          this.store.setError(error);
        })
      ),
    { dispatch: false }
  );
}

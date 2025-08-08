import { inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { tap } from "rxjs";
import { ToastStore } from "./toast.store";
import { toastActions } from "./toast.actions";

export const toastEffects = {
  show: createEffect(
    () => {
      const actions$ = inject(Actions);
      const toastStore = inject(ToastStore);

      return actions$.pipe(
        ofType(toastActions.show),
        tap(({ item, toastType, duration }) => {
          toastStore.show(item, toastType, duration);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  dismiss: createEffect(
    () => {
      const actions$ = inject(Actions);
      const toastStore = inject(ToastStore);

      return actions$.pipe(
        ofType(toastActions.dismiss),
        tap(({ id }) => {
          toastStore.dismiss(id);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  clearAll: createEffect(
    () => {
      const actions$ = inject(Actions);
      const toastStore = inject(ToastStore);

      return actions$.pipe(
        ofType(toastActions.clearAll),
        tap(() => {
          toastStore.clearAll();
        })
      );
    },
    { functional: true, dispatch: false }
  )
};

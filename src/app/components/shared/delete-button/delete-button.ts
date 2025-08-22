import { Component, computed, effect, inject, input, OnDestroy, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { ActionCreator } from '@ngrx/store';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-delete-button',
  imports: [],
  templateUrl: './delete-button.html',
  styleUrl: './delete-button.css'
})
export class DeleteButton implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private actions$ = inject(Actions);

  readonly onDelete = input<(() => void) | null>();
  readonly disabled = input<boolean>(false);
  readonly successAction = input<ActionCreator[] | ActionCreator | null>(null);
  
  backUrl = toSignal(
    this.route.queryParams.pipe(
      map(params => params['burl'] ?? null)
    ),
    { initialValue: null }
  );

  handleDelete(): void {
    const deleteHandler = this.onDelete();
    if (deleteHandler) {
      deleteHandler();
    }
  }

  private readonly successActionEffect = effect((onCleanup) => {
    const creators = this.successAction();
    if (!creators) return;
  
    const creatorArray = Array.isArray(creators) ? creators : [creators];
    
    const subscription = this.actions$.pipe(
      ofType(...creatorArray),
      tap(() => {
        const url = untracked(() => this.backUrl());
        this.router.navigate([url ?? '/']);
      })
    ).subscribe();
  
    onCleanup(() => subscription.unsubscribe());
  });

  ngOnDestroy() {
    this.successActionEffect.destroy();
  }
}

import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ofType } from '@ngrx/effects';
import { bankCashActions, BankCashStore } from '../../../store/bank-cash';
import { map, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-delete-bank-cash',
  imports: [SkeltonLoader, CancelButton],
  templateUrl: './delete-bank-cash.html',
  styleUrl: './delete-bank-cash.css'
})
export class DeleteBankCash {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly bankCashStore = inject(BankCashStore);
  readonly selectedBankCash = this.bankCashStore.selectedItem;
  protected loading = true;
  private itemId = signal<string | null>(null);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private backUrl = toSignal(
    this.route.queryParams.pipe(
      map(params => params['burl'] ?? null)
    ),
    { initialValue: null }
  );
  
  
  private fetchBankCashEffect = effect(() => {
    this.loading = false;
  });

  private readonly successActionEffect = effect((onCleanup) => {
  
    // Normalize to array
    const subscription = this.actions$.pipe(
      ofType(bankCashActions.deleteBankCashSuccess),
      tap(() => {
        const url = untracked(() => this.backUrl());
        this.router.navigate([url ?? '/']);
      })
    ).subscribe();
  
    onCleanup(() => subscription.unsubscribe());
  });

  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        // this.successAction.set(bankCashActions.deleteBankCashSuccess);
        this.loading = true;
        this.store.dispatch(bankCashActions.loadBankCashById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete() {
    this.store.dispatch(bankCashActions.deleteBankCash({ id: this.itemId()! }));
  }
  onDestroy() {
    this.fetchBankCashEffect.destroy();
    this.successActionEffect.destroy();
  }
}

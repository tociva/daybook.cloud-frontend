import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { BankCashStore, bankCashActions } from '../../../store/bank-cash';
import { NgIcon } from '@ng-icons/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-bank-cash',
  imports: [NgClass, NgIcon],
  templateUrl: './list-bank-cash.html',
  styleUrl: './list-bank-cash.css'
})
export class ListBankCash implements OnInit {
  private store = inject(Store);
  protected bankCashStore = inject(BankCashStore);
  private router = inject(Router);
  // Loading state flag
  protected isLoading = signal(false);

  ngOnInit(): void {
    this.loadBankCashes();
  }

  loadBankCashes(): void {
    this.isLoading.set(true);
    this.store.dispatch(bankCashActions.loadBankCashes({ query: {} }));
    
    // Reset loading state after a short delay to allow for store updates
    setTimeout(() => {
      this.isLoading.set(false);
    }, 100);
  }

  onCreateBankCash(): void {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/create'], { queryParams: { burl: currentUrl } });
  }
}

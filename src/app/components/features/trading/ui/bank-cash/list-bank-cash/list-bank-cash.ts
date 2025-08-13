import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { BankCashStore, bankCashActions } from '../../../store/bank-cash';

@Component({
  selector: 'app-list-bank-cash',
  imports: [NgClass],
  templateUrl: './list-bank-cash.html',
  styleUrl: './list-bank-cash.css'
})
export class ListBankCash implements OnInit {
  private store = inject(Store);
  protected bankCashStore = inject(BankCashStore);
  
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
    // TODO: Navigate to create bank cash page or open modal
    console.log('Create Bank/Cash clicked');
  }
}

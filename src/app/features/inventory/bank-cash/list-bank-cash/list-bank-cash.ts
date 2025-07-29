import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadBankCash } from '../store/bank-cash.actions';
import { selectAllBankCash } from '../store/bank-cash.selectors';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { BankCash } from '../store/bank-cash.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DataTable } from '../../../../core/common/data-table/data-table';
import { DataTableColumnDefinition } from '../../../../core/common/data-table/data-table-column-defenition';
import { Paginator } from '../../../../core/common/paginator/paginator';

@Component({
  selector: 'app-list-bank-cash',
  imports: [CommonModule, MatPaginatorModule, DataTable, Paginator],
  templateUrl: './list-bank-cash.html',
  styleUrl: './list-bank-cash.scss'
})
export class ListBankCash {

  private destroy$ = new Subject<void>();

  banks: BankCash[] = [];
  page = 0;
  limit = 10;
  totalCount = 0;
  columns: DataTableColumnDefinition<BankCash>[] = [
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
  ];

  constructor(private store: Store, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.store.select(selectAllBankCash).pipe(takeUntil(this.destroy$)).subscribe((banks) => {
      this.banks = banks;
    }); 
    this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe(params => {
      this.page = +params['page'] || 0;
      this.limit = +params['limit'] || 10;
      this.store.dispatch(loadBankCash({ query: { page: this.page, limit: this.limit } }));
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handlePageChange(event: { page: number; limit: number }) {
    this.page = event.page;
    this.limit = event.limit;
  }
  
}

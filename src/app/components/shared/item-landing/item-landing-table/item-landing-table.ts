import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import dayjs from 'dayjs';
import { DEFAULT_DATE_FORMAT } from '../../../../util/constants';
import { findQueryParamsOriginal, updateUrlParams } from '../../../../util/query-params-util';
import { DbcColumn } from '../../../../util/types/dbc-column.type';
import { DbcError } from '../../../../util/types/dbc-error.type';
import { EmptyListMessage } from '../../../../util/types/empty-list-message.type';
import { Status } from '../../../../util/types/status.type';
import { UserSessionStore } from '../../../core/auth/store/user-session/user-session.store';
import { formatAmountToFraction } from '../../../../util/currency.util';
import { CurrencyStore } from '../../store/currency/currency.store';

type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-item-landing-table',
  imports: [NgClass, NgIcon],
  templateUrl: './item-landing-table.html',
  styleUrl: './item-landing-table.css'
})
export class ItemLandingTable<T> {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dateFormat = signal<string>(DEFAULT_DATE_FORMAT);
  private userSessionStore = inject(UserSessionStore);
  private currencyStore = inject(CurrencyStore);
  private currencies = this.currencyStore.currencies;
  private fractions = signal<number>(2);
  readonly items = input<T[] | null>(null);
  readonly columns = input<DbcColumn<T>[]>([]);
  readonly error = input<DbcError | null>(null);
  readonly onEditItem = input<(item: T) => void>();
  readonly onDeleteItem = input<(item: T) => void>();
  readonly emptyListMessage = input<EmptyListMessage>({
    title: 'No items found',
    description: 'Get started by creating your first item.',
    buttonText: 'Create First Item'
  });
  readonly onRetry = input<() => void>(() => {
    return void 0;
  });
  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });

  // react when branch changes; allow writes
private readonly dateFormatEffect = effect(() => {
  const branch = this.userSessionStore.branch(); // registers dependency
  if (branch?.dateformat) {
    this.dateFormat.set(branch.dateformat);
  }
});

private readonly fractionsEffect = effect(() => {
  const fiscalYear = this.userSessionStore.fiscalYear(); // registers dependency
  const currencycode = fiscalYear?.currencycode;
  if(currencycode) {
    const currency = this.currencies().find(currency => currency.code === currencycode);
    if(currency) {
      this.fractions.set(currency.minorunit ?? 2);
    }
  }
});

  // Sorting state
  private sortColumnDetails: Partial<Record<keyof T | string, SortDirection>> = {};

  ngOnInit(): void {
    const queryParams = findQueryParamsOriginal(this.route);
    const {sort:sortQueryParam} = queryParams;
    if(sortQueryParam) {
      const sorts = sortQueryParam.split(',');
      sorts.forEach(sort => {
        const [column, direction] = sort.split(':');
        this.sortColumnDetails[column as keyof T | string] = direction as SortDirection;
      });
    }
  }
  ngOnDestroy(): void {
    this.dateFormatEffect.destroy();
    this.fractionsEffect.destroy();
  }

  findValue(item: T, column: DbcColumn<T>): unknown {
    const key = column.key as string;
    const value = key.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return null;
    }, item);
  if(column.type === 'date') {
    const dateFormat = this.dateFormat();
    return dayjs(value as string).format(dateFormat);
  } else if(column.type === 'number') {
    return formatAmountToFraction(value as number, this.fractions());
  }
    return value;
  }
  

  findTrackValue(item: T): string {
    const idItem = item as unknown as { id: string };
    return idItem.id;
  }

  isActive(item: T): boolean {
    const status = item as unknown as { status: Status };
    return status.status === Status.ACTIVE;
  }

  protected onSort(column: DbcColumn<T>): void {
    if (!column.sortable) return;
    
    const {key} = column;
    const sortDetails = this.sortColumnDetails[key];
    
    if (sortDetails) {
      // Same column - cycle through directions
      if (sortDetails === 'asc') {
        this.sortColumnDetails[key] = 'desc';
      } else if (sortDetails === 'desc') {
        this.sortColumnDetails[key] = null;
      } else {
        this.sortColumnDetails[key] = 'asc';
      }
    } else {
      // New column - start with ascending
      this.sortColumnDetails[key] = 'asc';
    }
    const queryParams = findQueryParamsOriginal(this.route);
    const {sort:sortQueryParam} = queryParams;
    if(sortQueryParam) {
      const sorts = sortQueryParam.split(',');
      const prevSort = sorts.find(sort => sort.startsWith(`${String(column.key)}:`));
      if(prevSort) {
        if(this.sortColumnDetails[key]) {
          sorts.splice(sorts.indexOf(prevSort), 1, `${String(column.key)}:${this.sortColumnDetails[key]}`);
        } else {
          sorts.splice(sorts.indexOf(prevSort), 1);
        }
      } else {
        sorts.push(`${String(column.key)}:${this.sortColumnDetails[key]}`);
      }
      const sort = sorts.length > 0 ? sorts.join(',') : null;
      updateUrlParams(this.router, this.route, { sort });
    } else {
      const sort = `${String(column.key)}:${this.sortColumnDetails[key]}`;
      updateUrlParams(this.router, this.route, { sort });
    }
    
  }
  
  // Get sort icon name
  protected getSortIcon(column: DbcColumn<T>): string {
    if (!column.sortable) return '';
    
    const currentDirection = this.sortColumnDetails[column.key];

    if (!currentDirection) {
      return 'bootstrapArrowsExpand'; // no-sort state
    }
    
    switch (currentDirection) {
      case 'asc':
        return 'bootstrapSortUp';
      case 'desc':
        return 'bootstrapSortDown';
      default:
        return 'bootstrapArrowsExpand';
    }
  }
}

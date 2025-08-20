import { Component, inject, model } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, updateUrlParams } from '../../../util/query-params-util';
import { AutoComplete } from '../../shared/auto-complete/auto-complete';

type SearchItem = { label: string; search?: string, type:'url' | 'search' };

@Component({
  selector: 'app-search-bar',
  imports: [ReactiveFormsModule, AutoComplete, NgIcon],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css'
})
export class SearchBar {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  // Simple form with one control
  readonly form = model<FormGroup>(new FormGroup({
    search: new FormControl<string>('', { nonNullable: true, validators: [Validators.minLength(1)] })
  }));

  // Options for the autocomplete
  options: SearchItem[] = [];

  optionDisplayValue = (item: SearchItem) => item?.label ?? '';
  inputDisplayValue = (item: SearchItem) => {
    if(!item) {
      return '';
    }
    return item.search ?? '';
  };

  private destroy$ = new Subject<void>();

  ngOnInit() {
      this.route.queryParams.pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe((params: QueryParamsOriginal) => {
        const { search } = params;
        if(search) {
          this.form().get('search')?.setValue({
            label: '',
            search,
            type: 'search'
          }, { emitEvent: false });
        } else {
          this.form().get('search')?.setValue({
            label: '',
            search: '',
            type: 'search'
          }, { emitEvent: false });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Fired when user hits Enter or your auto-complete emits search text
  onSearch = (query?: string) => {
    this.options = [{
      label: `Search in Bank/Cash - ${query}`,
      search: query,
      type: 'search'
    }]
  };

  // Fired when an option is picked
  onOptionSelected = (item: SearchItem) => {
    if(item.type === 'search') {
      updateUrlParams(this.router, this.route, {
        search: item.search,
      });
    }
  };
  onSubmit = () => {

  }
}

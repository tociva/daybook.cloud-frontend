import { Component, inject, model } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AutoComplete } from '../../shared/auto-complete/auto-complete';
import { updateUrlParams } from '../../../util/query-params-util';
import { ActivatedRoute, Router } from '@angular/router';

type SearchItem = { label: string; url?: string, type:'url' | 'search' };

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

  // Display function expected by <app-auto-complete>
  displayValue = (item: SearchItem) => item?.label ?? '';

  // Fired when user hits Enter or your auto-complete emits search text
  onSearch = (query?: string) => {
    this.options = [{
      label: `Search in Bank/Cash - ${query}`,
      url: query,
      type: 'search'
    }]
  };

  // Fired when an option is picked
  onOptionSelected = (item: SearchItem) => {
    if(item.type === 'search') {
      updateUrlParams(this.router, this.route, {
        search: item.url
      });
    }
  };
  onSubmit = () => {

  }
}

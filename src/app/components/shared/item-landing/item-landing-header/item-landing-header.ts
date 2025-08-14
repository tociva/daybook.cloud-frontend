import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { DbcError } from '../../../../util/types/dbc-error.type';

@Component({
  selector: 'app-item-landing-header',
  imports: [NgIcon],
  templateUrl: './item-landing-header.html',
  styleUrl: './item-landing-header.css'
})
export class ItemLandingHeader {

  readonly title = input<string>('');
  readonly error = input<DbcError | null>(null);
  readonly createButtonText = input<string>('Create new item');
  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });
}

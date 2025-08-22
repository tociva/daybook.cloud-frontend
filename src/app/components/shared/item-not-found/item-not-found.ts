import { Component, input } from '@angular/core';
import { CancelButton } from '../cancel-button/cancel-button';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-item-not-found',
  imports: [CancelButton, NgIcon],
  templateUrl: './item-not-found.html',
  styleUrl: './item-not-found.css'
})
export class ItemNotFound {
  readonly title = input<string>('Item not found');
  readonly description = input<string>('The item you are looking for does not exist.');
}

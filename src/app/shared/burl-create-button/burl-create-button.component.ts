import { Component, input, output } from '@angular/core';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

type BurlCreateButtonType = 'button' | 'submit';

@Component({
  selector: 'app-burl-create-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-create-button.component.html',
  styleUrl: './burl-create-button.component.css',
})
export class BurlCreateButtonComponent {
  readonly disabled = input(false);
  readonly icon = input('save');
  readonly label = input('Create');
  readonly type = input<BurlCreateButtonType>('submit');
  readonly clicked = output<Event>();
}

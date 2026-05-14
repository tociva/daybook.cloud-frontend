import { Component, input, output } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

type BurlCreateButtonType = 'button' | 'submit';

@Component({
  selector: 'app-burl-create-button',
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './burl-create-button.component.html',
})
export class BurlCreateButtonComponent {
  readonly disabled = input(false);
  readonly icon = input('save');
  readonly label = input('Create');
  readonly type = input<BurlCreateButtonType>('submit');
  readonly clicked = output<Event>();
}

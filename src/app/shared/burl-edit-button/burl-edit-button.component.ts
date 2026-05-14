import { Component, input, output } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

@Component({
  selector: 'app-burl-edit-button',
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './burl-edit-button.component.html',
})
export class BurlEditButtonComponent {
  readonly disabled = input(false);
  readonly label = input('Edit');
  readonly clicked = output<void>();
}

import { Component, input, output } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

@Component({
  selector: 'app-burl-delete-button',
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './burl-delete-button.component.html',
})
export class BurlDeleteButtonComponent {
  readonly disabled = input(false);
  readonly label = input('Delete');
  readonly clicked = output<void>();
}

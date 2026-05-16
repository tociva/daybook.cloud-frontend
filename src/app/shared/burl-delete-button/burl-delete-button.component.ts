import { Component, input, output } from '@angular/core';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

@Component({
  selector: 'app-burl-delete-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-delete-button.component.html',
  styleUrl: './burl-delete-button.component.css',
})
export class BurlDeleteButtonComponent {
  readonly disabled = input(false);
  readonly label = input('Delete');
  readonly clicked = output<void>();
}

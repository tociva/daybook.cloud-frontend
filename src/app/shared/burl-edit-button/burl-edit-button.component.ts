import { Component, input, output } from '@angular/core';
import { TngButtonComponent, TngProgressSpinnerComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

@Component({
  selector: 'app-burl-edit-button',
  imports: [TngButtonComponent, TngIcon, TngProgressSpinnerComponent],
  templateUrl: './burl-edit-button.component.html',
  styleUrl: './burl-edit-button.component.css',
})
export class BurlEditButtonComponent {
  readonly disabled = input(false);
  readonly label = input('Edit');
  readonly clicked = output<void>();
}

import { Component, input } from '@angular/core';
import { TngIcon } from '@tailng-ui/icons';

@Component({
  selector: 'app-empty-state',
  imports: [TngIcon],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
}

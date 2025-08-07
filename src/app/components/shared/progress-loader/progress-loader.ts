import { Component, inject } from '@angular/core';
import { UiStore } from '../../../state/ui/ui.store';

@Component({
  selector: 'app-progress-loader',
  imports: [],
  templateUrl: './progress-loader.html',
  styleUrl: './progress-loader.css'
})
export class ProgressLoader {
  
  readonly ui = inject(UiStore);

}

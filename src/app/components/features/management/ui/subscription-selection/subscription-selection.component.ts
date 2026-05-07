import { Component } from '@angular/core';
import {
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';

@Component({
  selector: 'app-subscription-selection',
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
  ],
  templateUrl: './subscription-selection.component.html',
  styleUrl: './subscription-selection.component.css',
})
export class SubscriptionSelectionComponent {}

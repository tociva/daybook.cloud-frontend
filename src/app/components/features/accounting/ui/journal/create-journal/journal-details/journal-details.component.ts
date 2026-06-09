import { Component, inject, input } from '@angular/core';
import {
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { FiscalYearDatepickerComponent } from '../../../../../../../shared/fiscal-year-datepicker';
import { JournalDraftStore } from '../journal-draft.store';

@Component({
  selector: 'app-journal-details',
  standalone: true,
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
  ],
  templateUrl: './journal-details.component.html',
  styleUrl: './journal-details.component.css',
})
export class JournalDetailsComponent {
  protected readonly draft = inject(JournalDraftStore);
  readonly isEdit = input(false);
}

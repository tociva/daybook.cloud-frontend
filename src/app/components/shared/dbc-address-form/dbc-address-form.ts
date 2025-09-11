import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { TextInputDirective } from '../../../util/directives/text-input-directive';

@Component({
  selector: 'dbc-address-form',
  imports: [ReactiveFormsModule, TextInputDirective],
  templateUrl: './dbc-address-form.html',
  styleUrl: './dbc-address-form.css'
})
export class DbcAddressForm {
/** Address group (required) */
group = input.required<FormGroup>();

/** Tailwind width class for labels */
labelWidth = input<string>('w-28');
}
